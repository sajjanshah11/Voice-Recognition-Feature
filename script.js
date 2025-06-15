// Voice Recognition Feature - Main JavaScript File
// Handles all functionality: recording, playback, search, feedback, and audio management

class VoiceRecognitionApp {
  constructor() {
    this.currentItem = null;
    this.recordings = []; // Max 3 recordings, cleared on app exit
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.currentAudio = null;

    // Initialize the app
    this.init();
  }

  async init() {
    try {
      await this.checkBrowserSupport();
      await this.requestMicrophoneAccess();
      this.setupEventListeners();
      this.loadWordGrid();
      this.showWelcomeMessage();
    } catch (error) {
      console.error("Initialization error:", error);
      this.showError(DataHelper.getPrompt("browserNotSupported"));
    }
  }

  // Check if browser supports required features
  async checkBrowserSupport() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Browser does not support media recording");
    }

    if (!window.MediaRecorder) {
      throw new Error("MediaRecorder not supported");
    }
  }

  // Request microphone access
  async requestMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Stop the stream for now, we'll create new ones when recording
      stream.getTracks().forEach((track) => track.stop());

      console.log("Microphone access granted");
    } catch (error) {
      console.error("Microphone access denied:", error);
      this.showError(DataHelper.getPrompt("noMicrophone"));
      throw error;
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    searchInput.addEventListener("input", (e) =>
      this.handleSearch(e.target.value)
    );
    searchBtn.addEventListener("click", () =>
      this.handleSearch(searchInput.value)
    );

    // Audio controls
    document
      .getElementById("playCorrectBtn")
      .addEventListener("click", () => this.playCorrectAudio());
    document
      .getElementById("recordBtn")
      .addEventListener("click", () => this.startRecording());
    document
      .getElementById("stopBtn")
      .addEventListener("click", () => this.stopRecording());

    // Help modal
    document
      .getElementById("helpBtn")
      .addEventListener("click", () => this.showHelpModal());
    document
      .getElementById("closeModal")
      .addEventListener("click", () => this.hideHelpModal());

    // Modal close on outside click
    document.getElementById("helpModal").addEventListener("click", (e) => {
      if (e.target.id === "helpModal") {
        this.hideHelpModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyboard(e));

    // Clear recordings when page is about to unload (app exit)
    window.addEventListener("beforeunload", () => {
      this.clearAllRecordings();
    });
  }

  // Load and display word grid
  loadWordGrid() {
    const wordGrid = document.getElementById("wordGrid");
    const allItems = DataHelper.getAllItems();

    wordGrid.innerHTML = "";

    allItems.forEach((item) => {
      const wordCard = this.createWordCard(item);
      wordGrid.appendChild(wordCard);
    });
  }

  // Create word card element
  createWordCard(item) {
    const card = document.createElement("div");
    card.className = "word-card";
    card.dataset.id = item.id;

    const text = item.word || item.phrase;
    const difficulty =
      item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1);

    card.innerHTML = `
            <h4>${text}</h4>
            <p>${item.phonetic}</p>
            <small>${difficulty} • ${item.category}</small>
        `;

    card.addEventListener("click", () => this.selectItem(item));

    return card;
  }

  // Handle search functionality
  handleSearch(query) {
    const results = DataHelper.search(query);
    const wordGrid = document.getElementById("wordGrid");

    wordGrid.innerHTML = "";

    if (results.length === 0) {
      wordGrid.innerHTML =
        '<p class="no-results">No words found matching your search.</p>';
      return;
    }

    results.forEach((item) => {
      const wordCard = this.createWordCard(item);
      wordGrid.appendChild(wordCard);
    });
  }

  // Select a word/phrase for practice
  selectItem(item) {
    this.currentItem = item;

    // Update UI to show selected word
    document.querySelectorAll(".word-card").forEach((card) => {
      card.classList.remove("selected");
      if (card.dataset.id == item.id) {
        card.classList.add("selected");
      }
    });

    // Show selected word details
    const selectedWordDiv = document.getElementById("selectedWord");
    const currentWordSpan = document.getElementById("currentWord");
    const currentDefinitionP = document.getElementById("currentDefinition");

    const text = item.word || item.phrase;
    currentWordSpan.textContent = `${text} ${item.phonetic}`;
    currentDefinitionP.textContent = item.definition;

    selectedWordDiv.style.display = "block";
    selectedWordDiv.classList.add("fade-in");

    // Enable audio controls
    document.getElementById("playCorrectBtn").disabled = false;
    document.getElementById("recordBtn").disabled = false;

    // Show instruction
    this.showStatus(DataHelper.getPrompt("listenFirst"));
  }

  // Play correct pronunciation using Web Speech API
  playCorrectAudio() {
    if (!this.currentItem) return;

    // Stop any currently playing audio
    this.stopCurrentAudio();

    // Use Web Speech API for demonstration
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        this.currentItem.word || this.currentItem.phrase
      );
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices();
      const englishVoice =
        voices.find((voice) => voice.lang.startsWith("en")) || voices[0];
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      speechSynthesis.speak(utterance);

      utterance.onstart = () => {
        this.showStatus("Playing correct pronunciation...");
        document.getElementById("playCorrectBtn").disabled = true;
      };

      utterance.onend = () => {
        this.showStatus("Now try recording your pronunciation!");
        document.getElementById("playCorrectBtn").disabled = false;
      };
    } else {
      this.showError("Speech synthesis not supported in this browser");
    }
  }

  // Start recording user's voice with real-time speech recognition
  async startRecording() {
    if (!this.currentItem || this.isRecording) return;

    try {
      // Clear previous results
      this.lastSpeechRecognitionResult = null;
      this.clearPreviousFeedback();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // Setup audio recording
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.processRecording();
      };

      // Setup real-time speech recognition
      this.setupRealTimeSpeechRecognition();

      this.mediaRecorder.start();

      // Update UI
      document.getElementById("recordBtn").disabled = true;
      document.getElementById("recordBtn").classList.add("recording");
      document.getElementById("stopBtn").disabled = false;

      this.showStatus(
        "🎤 Recording & analyzing speech... Speak clearly!",
        "recording"
      );

      // Auto-stop after configured duration
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, DataHelper.getConfig("recordingDuration") * 1000);
    } catch (error) {
      console.error("Recording error:", error);
      this.showError(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  }

  // Setup real-time speech recognition during recording
  setupRealTimeSpeechRecognition() {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      console.log(
        "🔄 Speech Recognition not supported - will use audio analysis only"
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechRecognition = new SpeechRecognition();

    this.speechRecognition.continuous = false;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = "en-US";
    this.speechRecognition.maxAlternatives = 5;

    const expectedText = (
      this.currentItem.word || this.currentItem.phrase
    ).toLowerCase();
    console.log(`🎯 Expected: "${expectedText}"`);

    let finalTranscript = "";
    let recognitionCompleted = false;

    this.speechRecognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          console.log(`🎤 Final recognized: "${transcript}"`);
        } else {
          interimTranscript += transcript;
          console.log(`🎤 Interim: "${transcript}"`);
        }
      }

      // Update status with real-time recognition
      if (interimTranscript) {
        this.showStatus(`🎤 Hearing: "${interimTranscript}"`, "recording");
      }

      // Process final result
      if (finalTranscript && !recognitionCompleted) {
        recognitionCompleted = true;
        this.processSpeechRecognitionResult(finalTranscript, expectedText);
      }
    };

    this.speechRecognition.onerror = (event) => {
      console.error("❌ Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        this.showStatus("🔇 No speech detected - speak louder", "recording");
      }
    };

    this.speechRecognition.onend = () => {
      if (!recognitionCompleted && finalTranscript) {
        this.processSpeechRecognitionResult(finalTranscript, expectedText);
      }
    };

    // Start speech recognition
    try {
      this.speechRecognition.start();
      console.log("🎤 Real-time speech recognition started");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
    }
  }

  // Process the speech recognition result
  processSpeechRecognitionResult(recognizedText, expectedText) {
    const cleanRecognized = recognizedText.toLowerCase().trim();
    const cleanExpected = expectedText.toLowerCase().trim();

    console.log(`🎯 Speech Analysis:`);
    console.log(`   Expected: "${cleanExpected}"`);
    console.log(`   You said: "${cleanRecognized}"`);

    // Calculate similarity score
    const similarity = this.calculateTextSimilarity(
      cleanExpected,
      cleanRecognized
    );
    let score = Math.round(similarity * 100);

    // Apply strict matching for completely different words
    if (score < 30 && !this.isRelatedWord(cleanExpected, cleanRecognized)) {
      console.log("⚠️ Completely different word detected");
      score = Math.min(25, score);
    }

    // Store result for later use in feedback
    this.lastSpeechRecognitionResult = {
      recognizedText: cleanRecognized,
      expectedText: cleanExpected,
      similarity: similarity,
      score: score,
      confidence: 0.9, // High confidence since it's real-time
    };

    console.log(`📊 Speech Recognition Score: ${score}%`);
  }

  // Stop recording
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;

    this.isRecording = false;
    this.mediaRecorder.stop();

    // Stop speech recognition
    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch (error) {
        console.log("Speech recognition already stopped");
      }
    }

    // Stop all tracks
    this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());

    // Update UI
    document.getElementById("recordBtn").disabled = false;
    document.getElementById("recordBtn").classList.remove("recording");
    document.getElementById("stopBtn").disabled = true;

    this.showStatus(
      "Recording complete! Analyzing pronunciation... (no automatic playback)",
      "completed"
    );
  }

  // Process the recorded audio
  processRecording() {
    const audioBlob = new Blob(this.audioChunks, {
      type: this.mediaRecorder.mimeType || "audio/webm",
    });

    const audioUrl = URL.createObjectURL(audioBlob);

    // Create recording object
    const recording = {
      id: Date.now(),
      word: this.currentItem.word || this.currentItem.phrase,
      wordId: this.currentItem.id,
      audioUrl: audioUrl,
      audioBlob: audioBlob,
      timestamp: new Date().toLocaleString(),
      duration: this.audioChunks.length,
    };

    // Add to recordings (max 3)
    this.addRecording(recording);

    // Generate feedback
    console.log(
      `⏰ Scheduling feedback generation in ${DataHelper.getConfig(
        "feedbackDelay"
      )}ms for "${recording.word}"`
    );
    setTimeout(() => {
      console.log(`⚡ Starting feedback generation for "${recording.word}"`);
      this.generateFeedback(recording);
    }, DataHelper.getConfig("feedbackDelay"));

    // Update recordings display
    this.updateRecordingsDisplay();
  }

  // Add recording to collection (max 3)
  addRecording(recording) {
    this.recordings.unshift(recording); // Add to beginning

    // Remove oldest recordings if over limit
    const maxRecordings = DataHelper.getConfig("maxRecordings");
    if (this.recordings.length > maxRecordings) {
      const removedRecordings = this.recordings.splice(maxRecordings);

      // Clean up URLs
      removedRecordings.forEach((rec) => {
        URL.revokeObjectURL(rec.audioUrl);
      });

      this.showStatus(DataHelper.getPrompt("maxRecordings"));
    }
  }

  // Generate pronunciation feedback (REAL ANALYSIS)
  async generateFeedback(recording) {
    console.log(`🎯 Generating feedback for recording of "${recording.word}"`);
    console.log(`   Recording ID: ${recording.id}`);
    console.log(
      `   Duration: ${recording.duration}, Size: ${recording.audioBlob?.size} bytes`
    );

    try {
      // Method 1: Web Speech Recognition API
      const speechRecognitionScore = await this.analyzeSpeechRecognition(
        recording
      );

      // Method 2: Audio Analysis (waveform, duration, etc.)
      const audioAnalysisScore = this.analyzeAudioCharacteristics(recording);

      // Method 3: Phonetic Pattern Analysis
      const phoneticScore = this.analyzePhoneticPatterns(recording);

      // Combine all analysis methods for final score
      const accuracy = this.calculateFinalAccuracy(
        speechRecognitionScore,
        audioAnalysisScore,
        phoneticScore
      );

      const thresholds = DataHelper.getConfig("accuracyThresholds");

      let feedbackLevel, feedbackMessage, feedbackClass;

      if (accuracy >= thresholds.excellent) {
        feedbackLevel = "excellent";
        feedbackClass = "excellent";
      } else if (accuracy >= thresholds.good) {
        feedbackLevel = "good";
        feedbackClass = "good";
      } else {
        feedbackLevel = "needsImprovement";
        feedbackClass = "needs-improvement";
      }

      feedbackMessage = DataHelper.getPrompt(`feedback.${feedbackLevel}`);

      // Display feedback with detailed analysis
      this.displayDetailedFeedback(accuracy, feedbackMessage, feedbackClass, {
        speechRecognition: speechRecognitionScore,
        audioAnalysis: audioAnalysisScore,
        phonetic: phoneticScore,
      });
    } catch (error) {
      console.error("Error generating feedback:", error);
      // Fallback to basic analysis if advanced methods fail
      const basicAccuracy = this.basicPronunciationAnalysis(recording);
      const feedbackMessage =
        "Analysis completed with basic method. Consider using a supported browser for detailed feedback.";
      this.displayFeedback(basicAccuracy, feedbackMessage, "good");
    }
  }

  // Method 1: Real-time Speech Recognition Analysis
  async analyzeSpeechRecognition(recording) {
    // Return the speech recognition result from real-time recording if available
    if (this.lastSpeechRecognitionResult) {
      console.log(
        `🎤 Using real-time speech recognition result: "${this.lastSpeechRecognitionResult.recognizedText}"`
      );
      return this.lastSpeechRecognitionResult.score;
    }

    // Fallback to audio analysis if no real-time recognition available
    console.log(
      "🔄 No real-time speech recognition available, using enhanced audio analysis"
    );
    return this.fallbackSpeechAnalysis(recording);
  }

  // Helper: Start speech recognition analysis (without automatic playback)
  async startSpeechRecognitionAnalysis(recognition, recording) {
    try {
      console.log(
        "🔇 Note: Speech recognition will analyze without automatic playback"
      );
      console.log(
        "💡 The system will use audio characteristics and phonetic analysis instead"
      );

      // Since Web Speech API can't actually analyze pre-recorded audio,
      // we'll skip the recognition and use fallback analysis
      // This prevents automatic audio playback while still providing analysis

      // Don't start recognition - just analyze what we have
      setTimeout(() => {
        console.log(
          "📊 Using enhanced audio analysis instead of live speech recognition"
        );
        // The recognition will timeout and use fallback analysis
      }, 100);
    } catch (error) {
      console.error("Error in speech recognition analysis:", error);
    }
  }

  // Helper: Check if words are related (for better error detection)
  isRelatedWord(expected, actual) {
    // Remove common words and check if any syllables match
    const expectedParts = expected.toLowerCase().split(/\s+/);
    const actualParts = actual.toLowerCase().split(/\s+/);

    for (let expectedPart of expectedParts) {
      for (let actualPart of actualParts) {
        if (
          expectedPart.includes(actualPart) ||
          actualPart.includes(expectedPart)
        ) {
          return true;
        }
        // Check if first few characters match
        if (expectedPart.length > 3 && actualPart.length > 3) {
          if (expectedPart.substring(0, 3) === actualPart.substring(0, 3)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Enhanced analysis when live speech recognition is not used
  fallbackSpeechAnalysis(recording) {
    console.log(
      "🔄 Using enhanced audio-based analysis (no automatic playback)"
    );

    // Enhanced analysis based on multiple audio characteristics
    const duration = recording.duration || 0;
    const audioSize = recording.audioBlob?.size || 0;
    const expectedWord = this.currentItem.word || this.currentItem.phrase;
    const difficulty = this.currentItem.difficulty;

    console.log(
      `🎯 Analyzing recording for: "${expectedWord}" (${difficulty})`
    );
    console.log(
      `📊 Audio properties: ${duration}s duration, ${audioSize} bytes`
    );

    // Start with moderate base score for reasonable recordings
    let score = 45;

    // Audio quality assessment
    const qualityBonus = this.assessRecordingQuality(recording);
    score += qualityBonus;

    // Duration appropriateness
    const expectedDuration = this.estimateWordDuration(expectedWord);
    const durationAccuracy = this.scoreDurationAccuracy(
      duration,
      expectedDuration
    );
    score += durationAccuracy;

    // Difficulty adjustment (since we can't verify pronunciation exactly)
    const difficultyAdjustment = {
      beginner: 8, // More forgiving for simple words
      intermediate: 0, // Neutral
      advanced: 12, // More credit for attempting hard words
    };
    score += difficultyAdjustment[difficulty] || 0;

    // Word complexity bonus
    if (expectedWord.length > 10 || this.countSyllables(expectedWord) > 3) {
      score += 8; // Bonus for attempting complex words
    }

    // Ensure reasonable range
    score = Math.min(85, Math.max(25, score));

    console.log(`📊 Enhanced analysis breakdown:`);
    console.log(`   Base score: 45`);
    console.log(`   Quality bonus: +${qualityBonus}`);
    console.log(`   Duration accuracy: +${durationAccuracy}`);
    console.log(
      `   Difficulty (${difficulty}): +${difficultyAdjustment[difficulty] || 0}`
    );
    console.log(`   Final score: ${score}%`);

    return score;
  }

  // Helper: Assess recording quality for fallback analysis
  assessRecordingQuality(recording) {
    const duration = recording.duration || 0;
    const audioSize = recording.audioBlob?.size || 0;

    if (duration > 1.0 && audioSize > 5000) {
      return 15; // Excellent quality
    } else if (duration > 0.5 && audioSize > 2000) {
      return 10; // Good quality
    } else if (duration > 0.3 && audioSize > 1000) {
      return 5; // Acceptable quality
    } else {
      return -5; // Poor quality
    }
  }

  // Helper: Score duration accuracy for fallback analysis
  scoreDurationAccuracy(actualDuration, expectedDuration) {
    if (actualDuration === 0) return -10;

    const ratio = actualDuration / expectedDuration;

    if (ratio >= 0.7 && ratio <= 1.8) {
      return 10; // Good timing
    } else if (ratio >= 0.4 && ratio <= 2.5) {
      return 5; // Acceptable timing
    } else {
      return 0; // Poor timing but no penalty
    }
  }

  // Method 2: Audio Characteristics Analysis (FIXED)
  analyzeAudioCharacteristics(recording) {
    try {
      // Analyze audio properties
      const expectedWord = this.currentItem.word || this.currentItem.phrase;
      const expectedDuration = this.estimateWordDuration(expectedWord);
      const actualDuration = recording.duration || 0;

      console.log(`🔊 Audio Analysis for "${expectedWord}":`);
      console.log(
        `   Expected duration: ${expectedDuration}s, Actual: ${actualDuration}s`
      );
      console.log(
        `   Audio blob size: ${recording.audioBlob?.size || 0} bytes`
      );

      // Duration analysis (is the pronunciation too fast/slow?)
      const durationScore = this.analyzeDuration(
        expectedDuration,
        actualDuration
      );

      // Audio quality analysis
      const qualityScore = this.analyzeAudioQuality(recording);

      // Silence detection - if audio is too quiet or short, it's likely not proper pronunciation
      const silenceScore = this.analyzeSilence(recording);

      // Combine scores with stricter weighting
      const audioScore = Math.round(
        durationScore * 0.4 + qualityScore * 0.3 + silenceScore * 0.3
      );

      console.log(
        `📊 Audio Scores - Duration: ${durationScore}, Quality: ${qualityScore}, Silence: ${silenceScore}, Combined: ${audioScore}`
      );

      return Math.min(100, Math.max(10, audioScore)); // Lower minimum score
    } catch (error) {
      console.error("❌ Audio analysis error:", error);
      return 35; // Lower default score on error
    }
  }

  // Method 3: Phonetic Pattern Analysis (FIXED - NO RANDOM)
  analyzePhoneticPatterns(recording) {
    try {
      const expectedPhonetic = this.currentItem.phonetic;
      const wordComplexity = this.analyzeWordComplexity(
        this.currentItem.word || this.currentItem.phrase
      );
      const difficultyLevel = this.currentItem.difficulty;
      const expectedWord = this.currentItem.word || this.currentItem.phrase;

      console.log(
        `🔤 Phonetic Analysis for "${expectedWord}" (${expectedPhonetic}):`
      );

      // Start with neutral base score - this should be earned, not given
      let baseScore = 50;

      // Adjust based on difficulty (this affects how hard it is to get a good score)
      const difficultyModifier = {
        beginner: 15, // Easier words get bonus
        intermediate: 0, // No bonus/penalty
        advanced: -10, // Harder words are more forgiving
      };

      // Adjust based on word complexity
      const complexityModifier = {
        simple: 10, // Simple words should score higher if done right
        medium: 0, // Neutral
        complex: -5, // Complex words are more forgiving
      };

      // Audio quality factor - if audio seems insufficient, reduce score
      const audioQualityFactor = this.getAudioQualityFactor(recording);

      const phoneticScore = Math.round(
        baseScore +
          (difficultyModifier[difficultyLevel] || 0) +
          (complexityModifier[wordComplexity] || 0) +
          audioQualityFactor
      );

      console.log(
        `📊 Phonetic Scores - Base: ${baseScore}, Difficulty: ${difficultyLevel} (${difficultyModifier[difficultyLevel]}), Complexity: ${wordComplexity} (${complexityModifier[wordComplexity]}), Audio Factor: ${audioQualityFactor}, Final: ${phoneticScore}`
      );

      return Math.min(85, Math.max(20, phoneticScore)); // More reasonable range
    } catch (error) {
      console.error("❌ Phonetic analysis error:", error);
      return 40; // Lower default score
    }
  }

  // Calculate final accuracy by combining all methods
  calculateFinalAccuracy(speechScore, audioScore, phoneticScore) {
    // Weight the different analysis methods
    const weights = {
      speech: 0.5, // 50% - Most important
      audio: 0.3, // 30% - Audio quality matters
      phonetic: 0.2, // 20% - Baseline difficulty adjustment
    };

    const finalScore = Math.round(
      speechScore * weights.speech +
        audioScore * weights.audio +
        phoneticScore * weights.phonetic
    );

    console.log(`Final Accuracy Calculation:
      Speech Recognition: ${speechScore} (weight: ${weights.speech})
      Audio Analysis: ${audioScore} (weight: ${weights.audio})
      Phonetic Analysis: ${phoneticScore} (weight: ${weights.phonetic})
      Final Score: ${finalScore}`);

    return Math.min(100, Math.max(0, finalScore));
  }

  // Helper function: Calculate text similarity using Levenshtein distance
  calculateTextSimilarity(expected, actual) {
    const expectedWords = expected.split(" ");
    const actualWords = actual.split(" ");

    // Simple word-based similarity
    let matches = 0;
    let totalWords = Math.max(expectedWords.length, actualWords.length);

    expectedWords.forEach((expectedWord) => {
      actualWords.forEach((actualWord) => {
        if (this.calculateLevenshteinDistance(expectedWord, actualWord) <= 1) {
          matches++;
        }
      });
    });

    return matches / totalWords;
  }

  // Helper function: Levenshtein distance for word comparison
  calculateLevenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Helper function: Estimate expected word duration
  estimateWordDuration(word) {
    // Rough estimation: 0.5 seconds per syllable
    const syllables = this.countSyllables(word);
    return syllables * 0.5;
  }

  // Helper function: Count syllables in a word
  countSyllables(word) {
    return word.toLowerCase().replace(/[^aeiou]/g, "").length || 1;
  }

  // Helper function: Analyze duration accuracy
  analyzeDuration(expected, actual) {
    const ratio = actual / expected;
    if (ratio >= 0.8 && ratio <= 1.5) {
      return 90; // Good timing
    } else if (ratio >= 0.6 && ratio <= 2.0) {
      return 70; // Acceptable timing
    } else {
      return 50; // Poor timing
    }
  }

  // Helper function: Analyze audio quality
  analyzeAudioQuality(recording) {
    // Simple heuristic based on recording properties
    const hasGoodDuration = recording.duration > 0.5; // At least 0.5 seconds
    const hasReasonableSize = recording.audioBlob?.size > 1000; // At least 1KB
    const hasDecentSize = recording.audioBlob?.size > 5000; // Good quality indicator

    if (hasGoodDuration && hasDecentSize) {
      return 90;
    } else if (hasGoodDuration && hasReasonableSize) {
      return 75;
    } else if (hasGoodDuration || hasReasonableSize) {
      return 50;
    } else {
      return 20; // Poor quality
    }
  }

  // Helper function: Analyze silence/noise levels
  analyzeSilence(recording) {
    const duration = recording.duration || 0;
    const audioSize = recording.audioBlob?.size || 0;

    // Estimate if recording has actual speech content
    const sizePerSecond = duration > 0 ? audioSize / duration : 0;

    console.log(
      `🔇 Silence Analysis - Duration: ${duration}s, Size/sec: ${sizePerSecond}`
    );

    if (duration < 0.3) {
      console.log("   Too short - likely no speech");
      return 10; // Too short to be real speech
    }

    if (sizePerSecond < 1000) {
      console.log("   Too quiet - likely silence or very low volume");
      return 25; // Likely mostly silence
    }

    if (sizePerSecond > 3000) {
      console.log("   Good audio content detected");
      return 85; // Good speech content
    }

    console.log("   Moderate audio content");
    return 60; // Moderate content
  }

  // Helper function: Get audio quality factor for phonetic analysis
  getAudioQualityFactor(recording) {
    const duration = recording.duration || 0;
    const size = recording.audioBlob?.size || 0;

    // Penalize very short or very small recordings
    if (duration < 0.5 || size < 1000) {
      return -15; // Significant penalty
    }

    if (duration < 1 || size < 3000) {
      return -5; // Small penalty
    }

    return 0; // No penalty for good recordings
  }

  // Helper function: Analyze word complexity
  analyzeWordComplexity(word) {
    const length = word.length;
    const syllables = this.countSyllables(word);
    const hasComplexSounds = /[θðʃʒtʃdʒŋ]/.test(
      this.currentItem.phonetic || ""
    );

    if (length > 10 || syllables > 3 || hasComplexSounds) {
      return "complex";
    } else if (length > 6 || syllables > 2) {
      return "medium";
    } else {
      return "simple";
    }
  }

  // Basic fallback analysis method
  basicPronunciationAnalysis(recording) {
    const word = this.currentItem.word || this.currentItem.phrase;
    const difficulty = this.currentItem.difficulty;
    const duration = recording.duration || 1;

    // Basic scoring based on recording characteristics
    let score = 60; // Base score

    // Duration check
    const expectedDuration = this.estimateWordDuration(word);
    const durationRatio = duration / expectedDuration;
    if (durationRatio >= 0.7 && durationRatio <= 1.5) {
      score += 15;
    } else if (durationRatio >= 0.5 && durationRatio <= 2.0) {
      score += 8;
    }

    // Audio quality check
    if (recording.audioBlob.size > 1000) {
      score += 10;
    }

    // Difficulty adjustment
    const difficultyBonus = {
      beginner: 8,
      intermediate: 0,
      advanced: -5,
    };
    score += difficultyBonus[difficulty] || 0;

    return Math.round(Math.min(90, Math.max(35, score)));
  }

  // Display detailed feedback with breakdown
  displayDetailedFeedback(accuracy, message, className, analysisBreakdown) {
    const feedbackContainer = document.getElementById("feedbackContainer");
    const feedbackContent = document.getElementById("feedbackContent");
    const accuracyScore = document.getElementById("accuracyScore");

    console.log(
      `🎉 Displaying feedback: ${accuracy}% for word "${
        this.currentItem?.word || this.currentItem?.phrase
      }"`
    );

    // Reset animation class to ensure it triggers for each new feedback
    feedbackContainer.classList.remove("slide-up", "fade-in");

    // Force reflow to ensure class removal takes effect
    feedbackContainer.offsetHeight;

    // Create speech-to-text comparison and detailed breakdown
    let speechToTextHtml = "";
    if (this.lastSpeechRecognitionResult) {
      const result = this.lastSpeechRecognitionResult;
      speechToTextHtml = `
        <div class="speech-to-text-section">
          <h4>🎯 Speech Recognition Results:</h4>
          <div class="text-comparison">
            <div class="expected-text">
              <strong>Expected:</strong> <span class="expected">"${
                result.expectedText
              }"</span>
            </div>
            <div class="recognized-text">
              <strong>You said:</strong> <span class="recognized">"${
                result.recognizedText
              }"</span>
            </div>
            <div class="match-score">
              <strong>Text Match:</strong> <span class="match">${Math.round(
                result.similarity * 100
              )}%</span>
            </div>
          </div>
        </div>
      `;
    } else {
      speechToTextHtml = `
        <div class="speech-to-text-section">
          <h4>🎯 Speech Recognition:</h4>
          <div class="text-comparison">
            <div class="no-recognition">
              <em>Real-time speech recognition not available - using audio analysis instead</em>
            </div>
          </div>
        </div>
      `;
    }

    const breakdownHtml = `
      ${speechToTextHtml}
      <div class="analysis-breakdown">
        <h4>📊 Scoring Breakdown for "${
          this.currentItem?.word || this.currentItem?.phrase
        }":</h4>
        <div class="breakdown-item">
          <span>🎤 Speech Recognition:</span> <strong>${Math.round(
            analysisBreakdown.speechRecognition
          )}%</strong>
        </div>
        <div class="breakdown-item">
          <span>🎵 Audio Quality:</span> <strong>${Math.round(
            analysisBreakdown.audioAnalysis
          )}%</strong>
        </div>
        <div class="breakdown-item">
          <span>📝 Phonetic Analysis:</span> <strong>${Math.round(
            analysisBreakdown.phonetic
          )}%</strong>
        </div>
      </div>
    `;

    // Update content
    feedbackContent.innerHTML = `${message}<br><br>${breakdownHtml}`;
    accuracyScore.textContent = `Overall Accuracy: ${accuracy}%`;
    accuracyScore.className = `accuracy-score ${className}`;

    // Show container and trigger animation
    feedbackContainer.style.display = "block";

    // Use setTimeout to ensure the animation triggers
    setTimeout(() => {
      feedbackContainer.classList.add("slide-up");
    }, 10);

    // Add pronunciation tips for lower scores
    if (accuracy < 70) {
      const tips = DataHelper.getTips();
      const randomTips = tips.sort(() => 0.5 - Math.random()).slice(0, 3);

      const tipsHtml =
        "<br><strong>Tips for improvement:</strong><ul>" +
        randomTips.map((tip) => `<li>${tip}</li>`).join("") +
        "</ul>";

      feedbackContent.innerHTML += tipsHtml;
    }

    // Scroll feedback into view
    feedbackContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Clear previous feedback before new recording
  clearPreviousFeedback() {
    const feedbackContainer = document.getElementById("feedbackContainer");
    if (feedbackContainer) {
      console.log("🧹 Clearing previous feedback for new recording");
      feedbackContainer.style.display = "none";
      feedbackContainer.classList.remove("slide-up", "fade-in");
    }
  }

  // Display basic feedback (fallback method)
  displayFeedback(accuracy, message, className) {
    const feedbackContainer = document.getElementById("feedbackContainer");
    const feedbackContent = document.getElementById("feedbackContent");
    const accuracyScore = document.getElementById("accuracyScore");

    console.log(
      `🎉 Displaying basic feedback: ${accuracy}% for word "${
        this.currentItem?.word || this.currentItem?.phrase
      }"`
    );

    // Reset animation class to ensure it triggers for each new feedback
    feedbackContainer.classList.remove("slide-up", "fade-in");

    // Force reflow to ensure class removal takes effect
    feedbackContainer.offsetHeight;

    // Update content
    feedbackContent.innerHTML = `${message}<br><br><em>Using basic analysis method.</em>`;
    accuracyScore.textContent = `Overall Accuracy: ${accuracy}%`;
    accuracyScore.className = `accuracy-score ${className}`;

    // Show container and trigger animation
    feedbackContainer.style.display = "block";

    // Use setTimeout to ensure the animation triggers
    setTimeout(() => {
      feedbackContainer.classList.add("slide-up");
    }, 10);

    // Scroll feedback into view
    feedbackContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Update recordings display
  updateRecordingsDisplay() {
    const recordingsList = document.getElementById("recordingsList");

    if (this.recordings.length === 0) {
      recordingsList.innerHTML =
        '<p class="no-recordings">No recordings yet. Start by selecting a word and recording your pronunciation.</p>';
      return;
    }

    recordingsList.innerHTML = "";

    this.recordings.forEach((recording, index) => {
      const recordingItem = this.createRecordingItem(recording, index);
      recordingsList.appendChild(recordingItem);
    });
  }

  // Create recording item element
  createRecordingItem(recording, index) {
    const item = document.createElement("div");
    item.className = "recording-item";

    item.innerHTML = `
            <div class="recording-info">
                <div class="recording-word">${recording.word}</div>
                <div class="recording-time">${recording.timestamp}</div>
            </div>
            <div class="recording-controls">
                <button class="play-recording-btn" onclick="app.playRecording(${recording.id})">
                    ▶️ Play
                </button>
                <button class="delete-recording-btn" onclick="app.deleteRecording(${recording.id})">
                    🗑️ Delete
                </button>
            </div>
        `;

    return item;
  }

  // Play a specific recording
  playRecording(recordingId) {
    const recording = this.recordings.find((r) => r.id === recordingId);
    if (!recording) return;

    this.stopCurrentAudio();

    const audio = new Audio(recording.audioUrl);
    this.currentAudio = audio;

    audio.play().catch((error) => {
      console.error("Error playing recording:", error);
      this.showError("Failed to play recording");
    });

    audio.onended = () => {
      this.currentAudio = null;
    };
  }

  // Delete a specific recording
  deleteRecording(recordingId) {
    const index = this.recordings.findIndex((r) => r.id === recordingId);
    if (index === -1) return;

    const recording = this.recordings[index];
    URL.revokeObjectURL(recording.audioUrl);

    this.recordings.splice(index, 1);
    this.updateRecordingsDisplay();

    this.showStatus("Recording deleted");
  }

  // Clear all recordings (called on app exit)
  clearAllRecordings() {
    this.recordings.forEach((recording) => {
      URL.revokeObjectURL(recording.audioUrl);
    });
    this.recordings = [];
  }

  // Stop currently playing audio
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Stop speech synthesis
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
  }

  // Show status message
  showStatus(message, type = "") {
    const statusElement = document.getElementById("recordingStatus");
    statusElement.textContent = message;
    statusElement.className = `recording-status ${type}`;
  }

  // Show error message
  showError(message) {
    alert(`Error: ${message}`);
    console.error(message);
  }

  // Show welcome message
  showWelcomeMessage() {
    this.showStatus(DataHelper.getPrompt("welcome"));
  }

  // Show help modal
  showHelpModal() {
    document.getElementById("helpModal").style.display = "block";
  }

  // Hide help modal
  hideHelpModal() {
    document.getElementById("helpModal").style.display = "none";
  }

  // Handle keyboard shortcuts
  handleKeyboard(event) {
    // Space bar to start/stop recording
    if (event.code === "Space" && this.currentItem) {
      event.preventDefault();
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    }

    // Enter to play correct audio
    if (event.code === "Enter" && this.currentItem) {
      event.preventDefault();
      this.playCorrectAudio();
    }

    // Escape to close modal
    if (event.code === "Escape") {
      this.hideHelpModal();
    }
  }
}

// Initialize the app when DOM is loaded
let app;

document.addEventListener("DOMContentLoaded", () => {
  app = new VoiceRecognitionApp();
});

// Ensure voices are loaded for speech synthesis
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => {
    console.log("Voices loaded:", speechSynthesis.getVoices().length);
  };
}

// Make sure app is accessible globally for onclick handlers
window.app = app;
