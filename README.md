# Anima

**Anima** is a simple chatbot that recommends anime based on user input. It processes the text, extracts tags, analyzes sentiment, and then filters a cleaned version of the [anime-offline-database](https://github.com/manami-project/anime-offline-database) to give smart recommendations.

## Features

* Cleans and filters the anime-offline-database to retain only relevant entries.
* Text sentiment analysis to distinguish positive and negative preferences.
* Custom tag matching system to handle partial matches.
* Intelligent filtering and ranking based on tags and user sentiment.

## Cleaned Database

The original anime data is sourced from the [anime-offline-database project](https://github.com/manami-project/anime-offline-database). According to their [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/), this repository includes a **modified version** of their database named [`cleaned_anime_database.csv`](./cleaned_anime_database.csv).

The modifications involve the following cleaning and filtering techniques:

### Cleaning Steps

1. Removed columns: `sources`, `thumbnail`, and `relatedAnime`.
2. Filtered only `TV` and `MOVIE` type anime.
3. Filtered only anime with `FINISHED` or `ONGOING` status.
4. Removed TV entries with less than 6 episodes.
5. Removed entries with missing release year.
6. Removed entries with too short duration:
   * Less than 5 minutes (300 seconds) for TV.
   * Less than 30 minutes (1800 seconds) for MOVIE.
7. Filtered out anime with average score lower than 6.
8. Extracted year, duration, and score into flat numeric fields.
9. Exported the final result to CSV for lightweight querying.

## How It Works

The chatbot analyzes user input in the following way:

* The text is split into sentences and tokenized.
* Each sentence is evaluated using sentiment analysis.
* Tags from positive sentences are considered **positive preferences**.
* Tags from negative sentences are considered **exclusions**.
* It performs a partial tag match to map words into valid database tags.
* Based on the results, the system filters the anime database.
* Get a maximum of 5 random anime recommendations based on the tags.
* Returns those recommendations sorted by score.

## Setup & Usage

1. Clone this repository:

   ```bash
   git clone https://github.com/Abzikel/Anima.git
   cd Anima
   ```

2. Install required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Run the chatbot:

   ```bash
   python main.py
   ```

4. Follow the on-screen prompts and get your anime recommendations!

### Examples

Example 1: Positive preferences with clear tags

   ```bash
   I love action and adventure anime with brave main characters. I also really enjoy fantasy and magic elements. Could you recommend something with a good story and interesting characters?
   ```

Example 2: Positive and negative preferences combined

   ```bash
   I don’t like romance anime or shows that are too slow.  I prefer something with a lot of excitement and epic battles, maybe some sci-fi.  Looking for anime with a closed ending and good animation quality.
   ```

Example 3: Mixed sentiment

   ```bash
   I want to avoid anime with too much absurd humor or ecchi. I like serious stories with strong psychological development. Also enjoy series with a touch of mystery and suspense.
   ```

Example 4: Short input with direct tags

   ```bash
   Recommend me comedy and slice of life anime.
   ```

Example 5: Casual

   ```bash
   Hey! I want something that grabs me from the first episode, with epic fights but not too complicated to follow. And please, no overly gory stuff.
   ```

## License

This repository is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. This means:

* You are free to use, modify, and share the code.
* You must keep the source code open if you deploy or distribute the software.

See the [LICENSE](./LICENSE) file for more details.

**Note:** The included anime data (`cleaned_anime_database.csv`) is derived from [anime-offline-database](https://github.com/manami-project/anime-offline-database) and is governed by the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/). Any use or redistribution of this data must comply with the terms of that license.
