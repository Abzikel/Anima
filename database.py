import requests
import json
import ast
import itertools
import pandas as pd
from datetime import datetime

# Constants to download the JSON URL and to save the file on the project
JSON_URL = 'https://raw.githubusercontent.com/manami-project/anime-offline-database/refs/heads/master/anime-offline-database.json'
LOCAL_FILENAME = 'anime-offline-database.json'
CSV_FILENAME = 'cleaned_anime_database.csv'

def download_database():
    # Verify if the file was updated 8 days ago or more
    print(f"Checking if {LOCAL_FILENAME} needs to be updated...")

    # Try to get the local file
    try:
        with open(LOCAL_FILENAME, 'r', encoding='utf-8') as f:
            # Open local file (if exists) and get "lastUpdate"
            local_data = json.load(f)
            last_update_str = local_data.get("lastUpdate")
            print(f"Last Update: {last_update_str}.")
    except FileNotFoundError:
            # The file wasn't found
            print(f"File {LOCAL_FILENAME} not found locally. Proceeding to download.")
            last_update_str = None

    if last_update_str:
        # Convert "lastUpdate" to DateTime
        last_update_date = datetime.strptime(last_update_str, "%Y-%m-%d")
        today = datetime.now()
        days_since_update = (today - last_update_date).days

        if days_since_update < 8:
            # There is no need to download the database
            print(f"Less than 8 days ({days_since_update} days) since last update ({last_update_str}). Skipping download.")
            return False

    # Try to download the JSON file using the URL if there is a conexion
    print(f"Trying to download/update {LOCAL_FILENAME} from {JSON_URL}...")
    try:
        # Make the GET request
        response = requests.get(JSON_URL, timeout=30)
        response.raise_for_status()

        # If the request was successful (code 200 OK)
        print("Successful download. Saving file...")

        # Save file on the root project
        with open(LOCAL_FILENAME, 'w', encoding='utf-8') as f:
            f.write(response.text)
        print(f"File {LOCAL_FILENAME} saved correctly.")

        # Clean database
        clean_database()

        return True

    except requests.exceptions.ConnectionError as e:
        # Error connection because of the internet
        print(f"Error Connection: Couldn't connect to {JSON_URL}. Verify your internet connection.")
        print(f"Details: {e}")
        return False
    except requests.exceptions.Timeout as e:
        # Timeout error during the connection
        print(f"Error: Timeout during connection {JSON_URL}.")
        print(f"Details: {e}")
        return False
    except requests.exceptions.HTTPError as e:
        # HTTP error in case the server returned an error
        print(f"Error HTTP: The server returned an error.")
        print(f"Status code: {e.response.status_code}")
        print(f"Details: {e}")
        return False
    except requests.exceptions.RequestException as e:
        # Another error from the requests library
        print(f"Error: {e}")
        return False
    except Exception as e:
        # Another kind of error
        print(f"Unexpected error: {e}")
        return False
    
def clean_database():
    # Open the JSON file and convert the anime information to a DataFrame
    try:
        # Open the JSON File
        with open(LOCAL_FILENAME, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Convert the JSON data to a DataFrame
        df = pd.DataFrame(data['data'])

        # Drop the 'sources' and 'thumbnail' columns
        df = df.drop(columns=['sources', 'thumbnail', 'relatedAnime'])

        # Filter for 'TV' and 'MOVIE' types
        df = df[df['type'].isin(['TV', 'MOVIE'])]

        # Filter for 'FINISHED' and 'ONGOING' status
        df = df[df['status'].isin(['FINISHED', 'ONGOING'])]

        # Filter out 'TV' anime with less than 6 episodes
        df = df[~((df['type'] == 'TV') & (df['episodes'] < 6))]

        # Extract the 'year' from the 'animeSeason' column and delete 'animeSeason' column
        df['year'] = df['animeSeason'].apply(lambda x: x['year'])
        df = df.drop(columns=['animeSeason'])

        # Filter out rows where 'year' is null
        df = df[df['year'].notnull()]

        # Convert 'year' column to int64
        df['year'] = df['year'].astype('int64')

        # Extract the 'value' from the 'duration' column, replacing None with 0
        df['duration'] = df['duration'].apply(lambda x: x['value'] if isinstance(x, dict) and 'value' in x else 0)

        # Convert the 'duration' column to int64
        df['duration'] = df['duration'].astype('int64')

        # Filter out TV animes with duration less than 5 minutes (300 seconds)
        df = df[~((df['type'] == 'TV') & (df['duration'] < 300) & (df['duration'] != 0))]

        # Filter out MOVIE animes with duration less than 30 minutes (1800 seconds)
        df = df[~((df['type'] == 'MOVIE') & (df['duration'] < 1800) & (df['duration'] != 0))]

        # Extract the 'arithmeticMean' from the 'score' column, replacing None with 0
        df['score'] = df['score'].apply(lambda x: x['arithmeticMean'] if isinstance(x, dict) and 'arithmeticMean' in x else 0)

        # Filter out animes with a score less than 6
        df = df[~((df['score'] < 6) & (df['score'] != 0))]

        # Reset the index after filtering
        df = df.reset_index(drop=True)

        # Show important information of the DataFrame
        print(f"\nLoaded and cleaned anime database from {LOCAL_FILENAME} into a DataFrame.\n")
        print(df.info())

        # Count the number of TV and MOVIE entries
        num_total_entries = len(df)
        num_tv_entries = len(df[df['type'] == 'TV'])
        num_movie_entries = len(df[df['type'] == 'MOVIE'])
        print(f"\nNumber of TV entries: {num_tv_entries} ({round((num_tv_entries / num_total_entries) * 100, 2)}%)")
        print(f"Number of MOVIE entries: {num_movie_entries}({round((num_movie_entries / num_total_entries) * 100, 2)}%)")

        # Convert DataFrame to CSV
        df.to_csv(CSV_FILENAME, index=False, encoding='utf-8')
        print(f"\nDataFrame saved to {CSV_FILENAME}")

        return True
    except FileNotFoundError:
        print(f"Error: File not found at {LOCAL_FILENAME}.  Please run download_database() first.")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None
    
def get_unique_tags():
    # Create DataFrame using the cleaned CSV file
    anime_df = pd.read_csv('cleaned_anime_database.csv')

    # Get unique tags
    unique_tags = set()
    for tags in anime_df['tags']:
        # Convert the "tags" to a list
        tags_list = ast.literal_eval(tags)
        if isinstance(tags_list, list):
            for tag in tags_list:
                # Add tag to the set
                unique_tags.add(tag)

    # Return unique tags
    return list(unique_tags)

def filter_anime(positive_tags, negative_tags, tv_only):
    # Load anime data from CSV file
    anime_df = pd.read_csv(CSV_FILENAME)

    # Filter by anime type (either TV series or movies)
    anime_type = 'TV' if tv_only else 'MOVIE'
    anime_df = anime_df[anime_df['type'] == anime_type]

    # Convert string representation of tags to actual Python lists
    anime_df['tags'] = anime_df['tags'].apply(lambda x: ast.literal_eval(x))

    # Convert input tags to appropriate data structures
    positive_tags = list(positive_tags)

    # Search for anime starting with the largest combination of positive tags first
    for num_tags in range(len(positive_tags), 0, -1):
        # Generate all possible combinations of the current number of positive tags
        tag_combinations = list(itertools.combinations(positive_tags, num_tags))
        combined_results = pd.DataFrame()

        # Check each combination of positive tags
        for tag_combo in tag_combinations:
            required_tags = set(tag_combo)
            
            # Find anime that have all tags in the current combination
            matches = anime_df[anime_df['tags'].apply(
                lambda anime_tags: required_tags.issubset(set(anime_tags))
            )]
            
            combined_results = pd.concat([combined_results, matches])

        # Remove duplicate anime entries (same title)
        combined_results = combined_results.drop_duplicates(subset=['title'])

        if not combined_results.empty:
            if negative_tags:
                # Filter out anime that contain any negative tags
                filtered_results = combined_results[~combined_results['tags'].apply(
                    lambda tags: bool(set(tags) & negative_tags)
                )]

                return filtered_results
            else:
                return combined_results

    # If no anime matched any positive tag combination
    return pd.DataFrame()

if __name__ == "__main__":
    # Test functionality
    download_database()

    # Get unique tags and show them
    unique_tags = get_unique_tags()
    shortest_tag = min(unique_tags, key=len)
    print("\nUnique Tags:")
    print(unique_tags)
    print(f"\nUnique Tags (Size): {len(unique_tags)} tags")
    print(f"\nShortest Tag: '{shortest_tag}' with {len(shortest_tag)} length.")

    # Filter animes by tags
    positive_tags = {"shoujo", 'action', 'gender bender'}
    negative_tags = {"alien", "hentai"}
    matching_anime = filter_anime(positive_tags, negative_tags, True)

    print("\nAnimes matching the search tags:")
    print(matching_anime)
