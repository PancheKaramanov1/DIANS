import requests
from bs4 import BeautifulSoup
import psycopg2
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import config
import time

def insert_stock_data_batch(connection, data_batch):
    try:
        cursor = connection.cursor()
        cursor.executemany(
            'CALL public.populatestockprices(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)',
            data_batch
        )
        connection.commit()
        print(f"Inserted batch of {len(data_batch)} entries.")
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error inserting data: {error}")
        connection.rollback()
    finally:
        cursor.close()

def get_dropdown_options(soup):
    select_element = soup.find('select', id='Code')
    options = select_element.find_all('option') if select_element else []
    return [option.get('value') for option in options]

def filter_options(options):
    return [value for value in options if not any(char.isdigit() for char in value)]

def get_last_data_dates(connection):
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT code, MAX(date) FROM stock_prices GROUP BY code")
        result = cursor.fetchall()
        return {row[0]: row[1] for row in result}
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error fetching last data dates: {error}")
        return {}
    finally:
        cursor.close()

def scrape_data(code, from_date, to_date):
    url = 'https://www.mse.mk/mk/stats/symbolhistory/REPL'
    data = {
        'FromDate': from_date,
        'ToDate': to_date,
        'Code': code
    }
    response = requests.post(url, data=data)
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

def scrape_for_year_and_prepare_data(code, year, last_data_dates):
    # Check if data already exists for the year
    if code in last_data_dates and last_data_dates[code].year >= year:
        print(f"Data for {code} already exists for {year}. Skipping...")
        return []  # Skip if data already exists

    # Fetch data for the specified year
    from_date = f"01.01.{year}"
    to_date = f"31.12.{year}"

    data = scrape_data(code, from_date, to_date)
    results = []

    for entry in data:
        procedure_data = (
            datetime.strptime(entry[0], "%d%m%Y").strftime("%d%m%Y"),
            float(entry[1].replace(',', '.')) if entry[1] else 0.00,
            float(entry[2].replace(',', '.')) if entry[2] else 0.00,
            float(entry[3].replace(',', '.')) if entry[3] else 0.00,
            float(entry[4].replace(',', '.')) if entry[4] else 0.00,
            float(entry[5].replace(',', '.')) if entry[5] else 0.00,
            int(entry[6]) if entry[6] else 0,
            float(entry[7].replace(',', '.')) if entry[7] else 0.00,
            float(entry[8].replace(',', '.')) if entry[8] else 0.00,
            code
        )
        results.append(procedure_data)

    return results

def main():
    start_time = time.time()
    try:
        params = config()
        connection = psycopg2.connect(**params)
        print('Connected to the database')

        url = 'https://www.mse.mk/mk/stats/symbolhistory/REPL'
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        options = get_dropdown_options(soup)
        codes = filter_options(options)

        last_data_dates = get_last_data_dates(connection)
        current_date = datetime.now().strftime("%d.%m.%Y")
        past_date = (datetime.now() - timedelta(days=365 * 10)).strftime("%d.%m.%Y")

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for code in codes:
                last_date = last_data_dates.get(code)

                if not last_date:
                    print(f"No data for {code}, scraping from past 10 years...")
                    from_year = 2014 
                else:
                    print(f"Data exists for {code}, scraping from {last_date + timedelta(days=1)}...")
                    from_year = (last_date + timedelta(days=1)).year

                for year in range(from_year, datetime.now().year + 1):
                    futures.append(executor.submit(scrape_for_year_and_prepare_data, code, year, last_data_dates))

            for future in as_completed(futures):
                try:
                    data_batch = future.result()
                    if data_batch:
                        insert_stock_data_batch(connection, data_batch)
                except Exception as e:
                    print(f"Error in scraping or inserting data: {e}")

    except Exception as e:
        print(f"Error connecting to the database: {e}")
    finally:
        if connection:
            connection.close()
            print('Database connection closed.')

    end_time = time.time()
    elapsed_time = end_time - start_time
    print(f"Total execution time: {elapsed_time:.2f} seconds")


if __name__ == "__main__":
    main()
