// Static data for voice recognition feature
// This file contains all the words/phrases, their definitions, and audio file paths
// No database dependency - all data is stored locally

const voiceRecognitionData = {
  words: [
    {
      id: 1,
      word: "pronunciation",
      definition: "The way in which a word is pronounced",
      category: "vocabulary",
      difficulty: "intermediate",
      audioPath: "audio/pronunciation.mp3",
      phonetic: "/prəˌnʌnsiˈeɪʃən/",
    },
    {
      id: 2,
      word: "articulation",
      definition: "The clear and distinct pronunciation of words",
      category: "vocabulary",
      difficulty: "advanced",
      audioPath: "audio/articulation.mp3",
      phonetic: "/ɑːˌtɪkjuˈleɪʃən/",
    },
    {
      id: 3,
      word: "vocabulary",
      definition: "The body of words used in a particular language",
      category: "vocabulary",
      difficulty: "intermediate",
      audioPath: "audio/vocabulary.mp3",
      phonetic: "/vəˈkæbjuləri/",
    },
    {
      id: 4,
      word: "communication",
      definition: "The means of sending or receiving information",
      category: "vocabulary",
      difficulty: "intermediate",
      audioPath: "audio/communication.mp3",
      phonetic: "/kəˌmjuːnɪˈkeɪʃən/",
    },
    {
      id: 5,
      word: "literature",
      definition: "Written works of artistic merit",
      category: "vocabulary",
      difficulty: "intermediate",
      audioPath: "audio/literature.mp3",
      phonetic: "/ˈlɪtərətʃər/",
    },
    {
      id: 6,
      word: "education",
      definition: "The process of teaching and learning",
      category: "vocabulary",
      difficulty: "beginner",
      audioPath: "audio/education.mp3",
      phonetic: "/ˌɛdʒuˈkeɪʃən/",
    },
    {
      id: 7,
      word: "technology",
      definition:
        "The application of scientific knowledge for practical purposes",
      category: "vocabulary",
      difficulty: "intermediate",
      audioPath: "audio/technology.mp3",
      phonetic: "/tɛkˈnɒlədʒi/",
    },
    {
      id: 8,
      word: "knowledge",
      definition:
        "Information and skills acquired through experience or education",
      category: "vocabulary",
      difficulty: "beginner",
      audioPath: "audio/knowledge.mp3",
      phonetic: "/ˈnɒlɪdʒ/",
    },
    {
      id: 9,
      word: "understanding",
      definition: "The ability to comprehend something",
      category: "vocabulary",
      difficulty: "intermediate",
      audioPath: "audio/understanding.mp3",
      phonetic: "/ˌʌndərˈstændɪŋ/",
    },
    {
      id: 10,
      word: "comprehension",
      definition: "The ability to understand something",
      category: "vocabulary",
      difficulty: "advanced",
      audioPath: "audio/comprehension.mp3",
      phonetic: "/ˌkɒmprɪˈhɛnʃən/",
    },
    {
      id: 11,
      word: "beautiful",
      definition: "Pleasing to the senses or mind aesthetically",
      category: "adjectives",
      difficulty: "beginner",
      audioPath: "audio/beautiful.mp3",
      phonetic: "/ˈbjuːtɪfəl/",
    },
    {
      id: 12,
      word: "magnificent",
      definition: "Extremely beautiful, elaborate, or impressive",
      category: "adjectives",
      difficulty: "intermediate",
      audioPath: "audio/magnificent.mp3",
      phonetic: "/mæɡˈnɪfɪsənt/",
    },
    {
      id: 13,
      word: "extraordinary",
      definition: "Very unusual or remarkable",
      category: "adjectives",
      difficulty: "advanced",
      audioPath: "audio/extraordinary.mp3",
      phonetic: "/ɪkˈstrɔːrdɪˌnɛri/",
    },
    {
      id: 14,
      word: "excellent",
      definition: "Extremely good; outstanding",
      category: "adjectives",
      difficulty: "beginner",
      audioPath: "audio/excellent.mp3",
      phonetic: "/ˈɛksələnt/",
    },
    {
      id: 15,
      word: "fascinating",
      definition: "Extremely interesting",
      category: "adjectives",
      difficulty: "intermediate",
      audioPath: "audio/fascinating.mp3",
      phonetic: "/ˈfæsɪˌneɪtɪŋ/",
    },
    {
      id: 16,
      word: "know",
      definition: "To be aware of through observation, inquiry, or information",
      category: "vocabulary",
      difficulty: "beginner",
      audioPath: "audio/know.mp3",
      phonetic: "/noʊ/",
    },
    {
      id: 17,
      word: "no",
      definition: "Used to give a negative response",
      category: "vocabulary",
      difficulty: "beginner",
      audioPath: "audio/no.mp3",
      phonetic: "/noʊ/",
    },
  ],

  // Phrases for advanced practice
  phrases: [
    {
      id: 101,
      phrase: "How are you today?",
      definition: "A common greeting asking about someone's well-being",
      category: "greetings",
      difficulty: "beginner",
      audioPath: "audio/how_are_you_today.mp3",
      phonetic: "/haʊ ɑr ju təˈdeɪ/",
    },
    {
      id: 102,
      phrase: "Thank you very much",
      definition: "An expression of gratitude",
      category: "courtesy",
      difficulty: "beginner",
      audioPath: "audio/thank_you_very_much.mp3",
      phonetic: "/θæŋk ju ˈvɛri mʌtʃ/",
    },
    {
      id: 103,
      phrase: "I would like to learn",
      definition: "Expressing desire to acquire knowledge",
      category: "learning",
      difficulty: "intermediate",
      audioPath: "audio/i_would_like_to_learn.mp3",
      phonetic: "/aɪ wʊd laɪk tu lɜrn/",
    },
    {
      id: 104,
      phrase: "Could you please help me?",
      definition: "A polite way to ask for assistance",
      category: "courtesy",
      difficulty: "intermediate",
      audioPath: "audio/could_you_please_help_me.mp3",
      phonetic: "/kʊd ju pliz hɛlp mi/",
    },
    {
      id: 105,
      phrase: "It's a pleasure to meet you",
      definition: "A formal greeting when meeting someone new",
      category: "greetings",
      difficulty: "advanced",
      audioPath: "audio/pleasure_to_meet_you.mp3",
      phonetic: "/ɪts ə ˈplɛʒər tu mit ju/",
    },
  ],

  // Configuration for voice recognition
  config: {
    maxRecordings: 3,
    recordingDuration: 10, // seconds
    feedbackDelay: 1000, // milliseconds
    accuracyThresholds: {
      excellent: 85,
      good: 70,
      needsImprovement: 50,
    },
    supportedCategories: [
      "vocabulary",
      "adjectives",
      "greetings",
      "courtesy",
      "learning",
    ],
    difficultyLevels: ["beginner", "intermediate", "advanced"],
  },

  // Default audio prompts and feedback messages
  prompts: {
    welcome:
      "Welcome to Voice Recognition Practice! Select a word or phrase to get started.",
    selectWord: "Please select a word or phrase to practice pronunciation.",
    listenFirst:
      "Listen to the correct pronunciation first, then try recording your own.",
    startRecording: "Click the record button and speak clearly.",
    recording: "Recording... Speak now!",
    recordingComplete: "Recording complete! Processing your pronunciation...",
    playback: "Click play to hear your recording.",
    feedback: {
      excellent: "Excellent pronunciation! You're doing great!",
      good: "Good job! Your pronunciation is quite good with minor areas for improvement.",
      needsImprovement:
        "Keep practicing! Focus on the highlighted sounds for better pronunciation.",
      noMatch:
        "Unable to process your recording. Please try again and speak more clearly.",
    },
    maxRecordings:
      "Maximum recordings reached. Older recordings will be automatically deleted.",
    noMicrophone:
      "Microphone access is required for voice recognition. Please allow microphone permissions.",
    browserNotSupported:
      "Your browser doesn't support voice recording. Please use a modern browser.",
  },

  // Tips for better pronunciation
  tips: [
    "Speak clearly and at a moderate pace",
    "Position your mouth close to the microphone",
    "Practice in a quiet environment",
    "Listen to the correct pronunciation multiple times",
    "Focus on individual sounds within words",
    "Record yourself multiple times for comparison",
    "Pay attention to stress patterns in words",
    "Use the phonetic transcription as a guide",
  ],
};

// Helper functions for data access
const DataHelper = {
  // Get all words and phrases combined
  getAllItems: function () {
    return [...voiceRecognitionData.words, ...voiceRecognitionData.phrases];
  },

  // Search function for words and phrases
  search: function (query) {
    const allItems = this.getAllItems();
    const searchTerm = query.toLowerCase().trim();

    if (!searchTerm) return allItems;

    return allItems.filter((item) => {
      const text = item.word || item.phrase;
      return (
        text.toLowerCase().includes(searchTerm) ||
        item.definition.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.phonetic.toLowerCase().includes(searchTerm)
      );
    });
  },

  // Filter by category
  filterByCategory: function (category) {
    const allItems = this.getAllItems();
    return allItems.filter((item) => item.category === category);
  },

  // Filter by difficulty
  filterByDifficulty: function (difficulty) {
    const allItems = this.getAllItems();
    return allItems.filter((item) => item.difficulty === difficulty);
  },

  // Get item by ID
  getItemById: function (id) {
    const allItems = this.getAllItems();
    return allItems.find((item) => item.id === id);
  },

  // Get random item for practice
  getRandomItem: function () {
    const allItems = this.getAllItems();
    const randomIndex = Math.floor(Math.random() * allItems.length);
    return allItems[randomIndex];
  },

  // Get config value
  getConfig: function (key) {
    return voiceRecognitionData.config[key];
  },

  // Get prompt message
  getPrompt: function (key) {
    const keys = key.split(".");
    let result = voiceRecognitionData.prompts;

    for (const k of keys) {
      result = result[k];
      if (!result) return "";
    }

    return result;
  },

  // Get all categories
  getCategories: function () {
    return voiceRecognitionData.config.supportedCategories;
  },

  // Get all difficulty levels
  getDifficultyLevels: function () {
    return voiceRecognitionData.config.difficultyLevels;
  },

  // Get pronunciation tips
  getTips: function () {
    return voiceRecognitionData.tips;
  },
};

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { voiceRecognitionData, DataHelper };
}
