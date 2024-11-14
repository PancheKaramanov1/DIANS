import requests
from bs4 import BeautifulSoup
import psycopg2
from psycopg2 import pool
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import config
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

connection_pool = None

def initialize_connection_pool():
    global connection_pool
    try:
        params = config()
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            **params
        )
        if connection_pool:
            logger.info("Connection pool created successfully")
    except Exception as e:
        logger.error(f"Error creating connection pool: {e}")

def get_connection():
    return connection_pool.getconn()

def release_connection(conn):
    connection_pool.putconn(conn)

def close_connection_pool():
    connection_pool.closeall()

def insert_stock_data_batch(data_batch):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.executemany(
                'CALL public.populatestockprices(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)',
                data_batch
            )
            conn.commit()
            logger.info(f"Inserted batch of {len(data_batch)} entries.")
    except psycopg2.DatabaseError as error:
        logger.error(f"Error inserting data: {error}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            release_connection(conn)

def get_session_with_retries(retries=3, backoff_factor=0.3, status_forcelist=(500, 502, 504)):
    session = requests.Session()
    retry = requests.packages.urllib3.util.retry.Retry(
        total=retries,
        read=retries,
        connect=retries,
        backoff_factor=backoff_factor,
        status_forcelist=status_forcelist
    )
    adapter = requests.adapters.HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def scrape_data(code, from_date, to_date):
    session = get_session_with_retries()
    url = 'https://www.mse.mk/mk/stats/symbolhistory/REPL'
    data = {
        'FromDate': from_date,
        'ToDate': to_date,
        'Code': code
    }
    try:
        response = session.post(url, data=data, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        table_body = soup.find('tbody')

        if not table_body:
            return []

        rows = table_body.find_all('tr')
        results = []
        for row in rows:
            cells = row.find_all('td')
            cell_values = [cell.get_text(strip=True) for cell in cells]
            cell_values = [value.replace('.', '').replace(',', '.') for value in cell_values]
            results.append(cell_values)

        return results
    except requests.exceptions.Timeout:
        logger.error(f"Timeout error for {code}. Skipping...")
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error for {code}: {e}")
    return []

def parse_float(value):
    try:
        if not value.strip():
            return 0.0
        return float(value.replace(',', '.').replace(' ', ''))
    except ValueError:
        logger.warning(f"Unable to parse float value: '{value}' - setting to 0.0")
        return 0.0

def parse_date(value, date_format="%d%m%Y"):
    try:
        return datetime.strptime(value, date_format)
    except ValueError:
        logger.warning(f"Invalid date format: {value}")
        return None

def scrape_for_missing_data(code, last_date):
    if(last_date == datetime.now().strftime("%Y-%m-%d")):
        return []
    
    results = []
    current_year = datetime.now().year
    start_year = last_date.year if last_date else current_year - 10

    for year in range(start_year, current_year + 1):
        from_date = last_date if last_date else f"01.01.{year}"
        to_date = f"31.12.{year}" if year < current_year else datetime.now().strftime("%d.%m.%Y")
        
        year_data = scrape_data(code, from_date, to_date)
        
        for entry in year_data:
            date_parsed = parse_date(entry[0])
            if date_parsed is None or parse_float(entry[5]) == 0.00:
                continue

            procedure_data = (
                date_parsed.strftime("%d%m%Y"),
                parse_float(entry[1]),
                parse_float(entry[2]),
                parse_float(entry[3]),
                parse_float(entry[4]),
                parse_float(entry[5]),
                int(entry[6]) if entry[6].isdigit() else 0,
                parse_float(entry[7]),
                parse_float(entry[8]),
                code
            )
            results.append(procedure_data)

    return results

def get_dropdown_options(soup):
    select_element = soup.find('select', id='Code')
    options = select_element.find_all('option') if select_element else []
    return [option.get('value') for option in options]

def filter_options(options):
    return [value for value in options if not any(char.isdigit() for char in value)]

def get_last_data_dates(connection):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT code, MAX(date) FROM stock_prices GROUP BY code")
            result = cursor.fetchall()
            return {row[0]: row[1] for row in result}
    except psycopg2.DatabaseError as error:
        logger.error(f"Error fetching last data dates: {error}")
        return {}

def main():
    start_time = time.time()
    initialize_connection_pool()

    try:
        conn = get_connection()
        response = requests.get('https://www.mse.mk/mk/stats/symbolhistory/REPL', timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        codes = filter_options(get_dropdown_options(soup))

        last_data_dates = get_last_data_dates(conn)
        release_connection(conn)

        with ThreadPoolExecutor(max_workers=15) as executor:
            futures = [
                executor.submit(scrape_for_missing_data, code, last_data_dates.get(code))
                for code in codes
            ]

            for future in as_completed(futures):
                data_batch = future.result()
                if data_batch:
                    insert_stock_data_batch(data_batch)

    except Exception as e:
        logger.error(f"Error in main process: {e}")
    finally:
        close_connection_pool()
        end_time = time.time()
        logger.info(f"Total execution time: {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    main()