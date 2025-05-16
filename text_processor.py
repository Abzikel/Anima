import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from difflib import get_close_matches
from database import get_unique_tags

def tokenize_text(text):
    # Tokenize text as sentences
    try:
        sentences = sent_tokenize(text)
    except Exception as e:
        print(f"Error: {e}")
        return [], []

    # Tokenize each sentence as words (excluding 1-character tokens)
    words_per_sentence = []
    for sentence in sentences:
        try:
            words = word_tokenize(sentence)

            # Filter words with more than 1 character
            filtered_words = [word for word in words if len(word) > 1]
            words_per_sentence.append(filtered_words)
        except Exception as e:
            print(f"Error trying to tokenize the sentence '{sentence}' as words: {e}")
            return [], []

    return sentences, words_per_sentence

def analyze_sentiment(text):
    # Initialize the VADER sentiment analyzer
    sentiment_analyzer = SentimentIntensityAnalyzer()
    
    try:
        # Get sentiment polarity scores for the text
        sentiment_scores = sentiment_analyzer.polarity_scores(text)
        
        # Get sentiment based on the score
        if sentiment_scores['compound'] >= 0.05:
            return 1  # Positivo
        elif sentiment_scores['compound'] <= -0.05:
            return -1 # Negativo
        else:
            return 0
    except Exception as e:
        print(f"Error analyzing text sentiment: {e}")
        return 0
    
def find_partial_tag_matches(user_words, cutoff = 0.8):
    # Get unique tags
    unique_tags = get_unique_tags()

    # Store all potential matches
    partial_matches = set()
    
    for word in user_words:
        word_lower = word.lower()
        
        # Fuzzy match with difflib
        close = get_close_matches(word_lower, unique_tags, n=1, cutoff=cutoff)
        partial_matches.update(close)

    return partial_matches

if __name__ == "__main__":
    # Download NLTK resources (only if they haven't been downloaded yet)
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        print("Descargando recurso 'punkt' de NLTK...")
        nltk.download('punkt')
    try:
        nltk.data.find('sentiment/vader_lexicon')
    except LookupError:
        print("Descargando recurso 'vader_lexicon' de NLTK...")
        nltk.download('vader_lexicon')
    
    # Request user's input
    user_text = input("Please, insert a text: ")

    # Tokenize text
    sentences, words_per_sentence = tokenize_text(user_text)

    # Print tokenize sentences
    if sentences:
        print("\nTokenize sentences:")
        for i, oracion in enumerate(sentences):
            print(f"Sentence {i+1}: {oracion}")

    # Print words tokenize per sentence
    if words_per_sentence:
        print("\nWord tokenize per sentence:")
        for i, palabras in enumerate(words_per_sentence):
            print(f"Sentence {i+1}: {palabras}")
    
    # Analyze sentiment of each sentence
    for sentence in sentences:
        sentiment_result = analyze_sentiment(sentence)
        if sentiment_result is not None:
            print("\nSentiment analysis from the sentence:")
            print(sentiment_result)

    # Get all user's words
    user_words = [word.lower() for sentence_words in words_per_sentence for word in sentence_words]

    # Find partial matches
    matched_tags = find_partial_tag_matches(user_words)
    print("\nPartial tag matches:")
    print(matched_tags)
