import requests
from bs4 import BeautifulSoup
import pandas as pd
import psycopg2
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import config


def insert_stock_data(connection, data):
    try:
        cursor = connection.cursor()
        cursor.execute(
            'CALL populatestockprices(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)',
            data
        )
        connection.commit()
        print(f"Data inserted for {data[9]} on {data[0]}")
    except (Exception, psycopg2.DatabaseError) as error:
        print(f"Error inserting data: {error}")
        connection.rollback()
    finally:
        cursor.close()


def get_dropdown_options(soup):
    select_element = soup.find('select', id='Code')
    options = select_element.find_all('option')
    return [option.get('value') for option in options]


def filter_options(options):
    def contains_number(value):
        return any(char.isdigit() for char in value)

    return [value for value in options if not contains_number(value)]


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

        for i, value in enumerate(cell_values):
            cell_values[i] = value.replace('.', '').replace(',', '.')

        results.append(cell_values)

    return results


def scrape_for_year_and_insert(code, year, connection):
    from_date = f"01.01.{year}"
    to_date = f"31.12.{year}"
    data = scrape_data(code, from_date, to_date)

    for entry in data:
        date = datetime.strptime(entry[0], "%d%m%Y").strftime("%d%m%Y")
        last_price = float(entry[1].replace(',', '.'))
        max_price = float(entry[2].replace(',', '.')) if entry[2] else last_price
        min_price = float(entry[3].replace(',', '.')) if entry[3] else last_price
        avg_price = float(entry[4].replace(',', '.'))
        percent_change = float(entry[5].replace(',', '.'))
        quantity = int(entry[6])
        best_turnover = float(entry[7].replace(',', '.'))
        total_turnover = float(entry[8].replace(',', '.'))
        code = code

        procedure_data = (
            date, last_price, max_price, min_price, avg_price, percent_change, quantity, best_turnover, total_turnover, code
        )

        insert_stock_data(connection, procedure_data)


def main():
    try:
        params = config()
        connection = psycopg2.connect(**params)
        print('Connected to the database')

        url = 'https://www.mse.mk/mk/stats/symbolhistory/REPL'
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        options = get_dropdown_options(soup)
        codes = filter_options(options)

        current_year = datetime.now().year

        with ThreadPoolExecutor(max_workers=10) as executor:
            future_to_code_year = {
                executor.submit(scrape_for_year_and_insert, code, year, connection): (code, year)
                for year in range(current_year - 10, current_year)
                for code in codes
            }

            for future in as_completed(future_to_code_year):
                code, year = future_to_code_year[future]
                try:
                    future.result()
                except Exception as e:
                    print(f"Error processing {code} for year {year}: {e}")
    except Exception as e:
        print(f"Error connecting to the database: {e}")
    finally:
        if connection:
            connection.close()
            print('Database connection closed.')


if __name__ == "__main__":
    main()
