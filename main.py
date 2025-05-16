# Import modules
from text_processor import tokenize_text, analyze_sentiment, find_partial_tag_matches
from database import filter_anime
import pandas as pd

if __name__ == "__main__":
    # Request user's input
    user_text = input("Please, insert a text: ")

    # Tokenize text
    sentences, words_per_sentence = tokenize_text(user_text)

    # Declare positive and negative tags
    positive_tags = set()
    negative_tags = set()

    # Declare boolean value for tv or movie
    tv_only = True

    # Get sentiment of each sentence
    for index, sentence in enumerate(sentences):
        # Get sentiment value and change words to lower case
        sentiment = analyze_sentiment(sentence)
        words_in_sentence = [word.lower() for word in words_per_sentence[index]]

        # Get positive and negative tags
        if sentiment == -1:
            # Add all words from this sentence to negative tags
            negative_tags.update(words_in_sentence)
        else:
            # Add all words from this sentence to positive tags
            positive_tags.update(words_in_sentence)

            # Verify if the word "movie" is in the sentence
            if "movie" in words_in_sentence:
                tv_only = False

    # To lower case

    # Clear negative tags
    negative_tags -= positive_tags

    # Find partial tag matches using the user's words
    negative_tags = find_partial_tag_matches(negative_tags)
    positive_tags = find_partial_tag_matches(positive_tags)

    # Filter anime by tags
    filtered_anime = filter_anime(positive_tags, negative_tags, tv_only)
    
    # Verify if the DataFrame is empty
    if filtered_anime.empty:
        print("Anima: Sorry, I could not understand you. Write another message pls.")
    else:
        # Get 5 random anime recommendaton based on the filtered DataFrame
        n_recommendations = min(5, len(filtered_anime))
        anime_recommendations = filtered_anime.sample(n = n_recommendations)

        # Sort recommendations by score (descending)
        anime_recommendations = anime_recommendations.sort_values('score', ascending=False)

        # Show recommendations to the user
        print("\n🎌 Here are your personalized anime recommendations 🎌\n")
        for index, anime in anime_recommendations.iterrows():
            print(anime['title'])
            print(f"Score: {anime['score']:.2f}")
            print(f"Episodes: {anime['episodes']}\n")
