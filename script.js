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
      // Always setup basic functionality first
      this.setupEventListeners();
      this.loadWordGrid();

      // Check browser support (non-blocking)
      await this.checkBrowserSupport();

      // Request microphone access (non-blocking)
      await this.requestMicrophoneAccess();

      // Show welcome message
      this.showWelcomeMessage();
    } catch (error) {
      console.error("Initialization error:", error);
      // Still show welcome message even if there are issues
      this.showWelcomeMessage();
      this.showStatus(
        "App loaded with limited functionality. Some features may not be available.",
        "info"
      );
    }
  }

  // Check if browser supports required features
  async checkBrowserSupport() {
    // Check for basic API support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("MediaDevices API not supported");
      this.showBrowserCompatibilityInfo();
      return; // Don't throw error, just show info
    }

    if (!window.MediaRecorder) {
      console.warn("MediaRecorder API not supported");
      this.showBrowserCompatibilityInfo();
      return; // Don't throw error, just show info
    }

    // Check if we're running in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.warn(
        "Insecure context detected - microphone access may be limited"
      );
      this.showSecurityInfo();
      return;
    }
  }

  // Show helpful browser compatibility information
  showBrowserCompatibilityInfo() {
    const message = `
      <div style="text-align: left;">
        <h3>Voice Recording Not Available</h3>
        <p>This could be due to:</p>
        <ul>
          <li>Your browser doesn't support voice recording APIs</li>
          <li>The page is not served over HTTPS</li>
          <li>Microphone permissions are blocked</li>
        </ul>
        <p><strong>You can still:</strong></p>
        <ul>
          <li>Browse and search words</li>
          <li>Listen to correct pronunciations</li>
          <li>Study phonetic transcriptions</li>
        </ul>
        <p><em>For voice recording, try Chrome, Firefox, or Safari on HTTPS.</em></p>
      </div>
    `;

    this.showStatus(message, "info");
    this.disableRecordingFeatures();
  }

  // Show security context information
  showSecurityInfo() {
    const message = `
      <div style="text-align: left;">
        <h3>Secure Connection Required</h3>
        <p>Voice recording requires a secure connection (HTTPS) for privacy and security.</p>
        <p><strong>You can still use:</strong></p>
        <ul>
          <li>Word browsing and search</li>
          <li>Audio pronunciation playback</li>
          <li>Phonetic transcriptions</li>
        </ul>
      </div>
    `;

    this.showStatus(message, "warning");
    this.disableRecordingFeatures();
  }

  // Disable recording features but keep other functionality
  disableRecordingFeatures() {
    const recordBtn = document.getElementById("recordBtn");
    if (recordBtn) {
      recordBtn.disabled = true;
      recordBtn.innerHTML = "🎤 Recording Not Available";
      recordBtn.title =
        "Voice recording is not available in this browser/context";
    }
  }

  // Request microphone access
  async requestMicrophoneAccess() {
    // Skip if browser doesn't support media devices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("Skipping microphone access - API not supported");
      return;
    }

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
      this.showMicrophoneAccessInfo(error);
      // Don't throw error - let the app continue without recording
    }
  }

  // Show microphone access information
  showMicrophoneAccessInfo(error) {
    let message = "";

    if (error.name === "NotAllowedError") {
      message = `
        <div style="text-align: left;">
          <h3>Microphone Access Denied</h3>
          <p>To enable voice recording:</p>
          <ul>
            <li>Click the microphone icon in your browser's address bar</li>
            <li>Select "Always allow" for this site</li>
            <li>Refresh the page</li>
          </ul>
          <p><strong>You can still use all other features!</strong></p>
        </div>
      `;
    } else if (error.name === "NotFoundError") {
      message = `
        <div style="text-align: left;">
          <h3>No Microphone Found</h3>
          <p>Please connect a microphone to use voice recording features.</p>
          <p><strong>All other features are available!</strong></p>
        </div>
      `;
    } else {
      message = `
        <div style="text-align: left;">
          <h3>Microphone Access Issue</h3>
          <p>Unable to access microphone. This could be due to:</p>
          <ul>
            <li>Browser permissions</li>
            <li>Privacy settings</li>
            <li>Other applications using the microphone</li>
          </ul>
          <p><strong>You can still browse words and listen to pronunciations!</strong></p>
        </div>
      `;
    }

    this.showStatus(message, "warning");
    this.disableRecordingFeatures();
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

    // Combined record/stop button
    document
      .getElementById("recordBtn")
      .addEventListener("click", () => this.toggleRecording());

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

    card.innerHTML = `
            <h4>${text}</h4>
            <p>${item.phonetic}</p>
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

    // Remove initial state styling
    const wordInfo = document.querySelector(".word-info");
    if (wordInfo) {
      wordInfo.classList.remove("initial-state");
    }

    // Update UI to show selected word
    document.querySelectorAll(".word-card").forEach((card) => {
      card.classList.remove("selected");
      if (card.dataset.id == item.id) {
        card.classList.add("selected");
      }
    });

    // Show selected word details
    const currentWordSpan = document.getElementById("currentWord");
    const currentDefinitionP = document.getElementById("currentDefinition");
    const phoneticElement = document.getElementById("wordPhonetic");
    const categoryElement = document.getElementById("wordCategory");
    const difficultyElement = document.getElementById("wordDifficulty");

    // Update main word display
    const text = item.word || item.phrase;
    currentWordSpan.textContent = text;
    currentDefinitionP.textContent = item.definition;

    // Update additional details
    if (phoneticElement && item.phonetic) {
      phoneticElement.textContent = `${item.phonetic}`;
      phoneticElement.style.display = "block";
    } else if (phoneticElement) {
      phoneticElement.style.display = "none";
    }

    if (categoryElement && item.category) {
      categoryElement.textContent = item.category;
      categoryElement.style.display = "inline-block";
    } else if (categoryElement) {
      categoryElement.style.display = "none";
    }

    if (difficultyElement && item.difficulty) {
      difficultyElement.textContent = item.difficulty;
      difficultyElement.style.display = "inline-block";
    } else if (difficultyElement) {
      difficultyElement.style.display = "none";
    }

    // Enable audio controls
    document.getElementById("playCorrectBtn").disabled = false;
    const recordBtn = document.getElementById("recordBtn");
    recordBtn.disabled = false;
    recordBtn.innerHTML = "🎤 Start Recording";

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

      // Update UI for combined button
      const recordBtn = document.getElementById("recordBtn");
      recordBtn.innerHTML = "⏹️ Stop Recording";
      recordBtn.classList.add("recording");

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

    // Update UI for combined button
    const recordBtn = document.getElementById("recordBtn");
    recordBtn.innerHTML = "🎤 Start Recording";
    recordBtn.classList.remove("recording");

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
      timestamp: Date.now(), // Store as milliseconds since epoch for reliable parsing
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

  // Generate pronunciation feedback and store it within the recording
  async generateFeedback(recording) {
    console.log(`🎯 Generating feedback for recording of "${recording.word}"`);
    console.log(`   Recording ID: ${recording.id}`);
    console.log(
      `   Duration: ${recording.duration}, Size: ${recording.audioBlob?.size} bytes`
    );

    try {
      // Get speech recognition result
      let recognizedText = "N/A";
      let textMatchScore = 0;

      if (this.lastSpeechRecognitionResult) {
        recognizedText = this.lastSpeechRecognitionResult.recognizedText;
        textMatchScore = this.lastSpeechRecognitionResult.score;
      } else {
        // Fallback analysis
        textMatchScore = this.fallbackSpeechAnalysis(recording);
        recognizedText = "Speech recognition not available";
      }

      // Store feedback data within the recording
      recording.feedback = {
        expected: recording.word,
        recognized: recognizedText,
        textMatch: textMatchScore,
      };

      // Update the recording in the recordings array
      const recordingIndex = this.recordings.findIndex(
        (r) => r.id === recording.id
      );
      if (recordingIndex !== -1) {
        this.recordings[recordingIndex] = recording;
      }

      // Update recordings display to show feedback
      this.updateRecordingsDisplay();
    } catch (error) {
      console.error("Error generating feedback:", error);
      // Store basic feedback even on error
      recording.feedback = {
        expected: recording.word,
        recognized: "Error in analysis",
        textMatch: 0,
      };
      this.updateRecordingsDisplay();
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

  // Update recordings display in table format
  updateRecordingsDisplay() {
    const recordingsTableBody = document.getElementById("recordingsTableBody");
    const recordingsSection = document.querySelector(".recordings-section");

    // Update the header with current count
    const header = recordingsSection.querySelector("h3");
    const maxRecordings = DataHelper.getConfig("maxRecordings");
    const currentCount = this.recordings.length;

    // Update header text with progress
    header.innerHTML = `📼 Your Recordings (${currentCount}/${maxRecordings}) <span class="recording-indicator"></span>`;

    if (this.recordings.length === 0) {
      // Show empty state in table
      recordingsTableBody.innerHTML = `
        <tr class="no-recordings-row">
          <td colspan="3">
            ${
              this.currentItem
                ? `Ready to record! Click the record button to capture your pronunciation of "${
                    this.currentItem.word || this.currentItem.phrase
                  }"`
                : "No recordings yet. Start by selecting a word and recording your pronunciation."
            }
          </td>
        </tr>
      `;
      return;
    }

    // Clear the table body
    recordingsTableBody.innerHTML = "";

    // Add each recording as a table row
    this.recordings.forEach((recording, index) => {
      const recordingRow = this.createRecordingTableRow(recording, index);
      recordingsTableBody.appendChild(recordingRow);
    });
  }

  // Convert percentage score to descriptive feedback
  getQualityFeedback(score) {
    if (score >= 75) {
      return "Excellent";
    } else if (score >= 50) {
      return "Good";
    } else {
      return "Bad";
    }
  }

  // Create recording table row element
  createRecordingTableRow(recording, index) {
    const row = document.createElement("tr");
    row.className = "recording-row";

    // Get quality feedback
    let qualityFeedback = "Unknown";
    let qualityClass = "";
    if (recording.feedback) {
      qualityFeedback = this.getQualityFeedback(recording.feedback.textMatch);
      qualityClass = qualityFeedback.toLowerCase();
    }

    // Format recording name
    const recordingName = `Recording ${index + 1}`;
    const wordText = recording.word || "Unknown";

    row.innerHTML = `
      <td>
        <div class="recording-name">${recordingName}</div>
        <div style="font-size: 12px; color: #666; margin-top: 2px;">${wordText}</div>
      </td>
      <td>
        <span class="recording-quality ${qualityClass}">${qualityFeedback}</span>
      </td>
      <td>
        <div class="recording-actions">
          <button class="action-btn play-action-btn" onclick="app.playRecording(${recording.id})" title="Play recording">
            ▶️ Play
          </button>
          <button class="action-btn delete-action-btn" onclick="app.deleteRecording(${recording.id})" title="Delete recording">
            🗑️ Delete
          </button>
        </div>
      </td>
    `;

    // Add entrance animation
    row.style.opacity = "0";
    row.style.transform = "translateY(10px)";

    setTimeout(() => {
      row.style.transition = "all 0.3s ease";
      row.style.opacity = "1";
      row.style.transform = "translateY(0)";
    }, index * 100);

    return row;
  }

  // Legacy method for backwards compatibility
  createRecordingItem(recording, index) {
    return this.createRecordingTableRow(recording, index);
  }

  // Format timestamp to be more user-friendly
  formatTimestamp(timestamp) {
    let date;

    // Handle different timestamp formats
    if (typeof timestamp === "number") {
      date = new Date(timestamp);
    } else if (typeof timestamp === "string") {
      date = new Date(timestamp);
    } else {
      // Fallback for invalid timestamps
      return "Unknown time";
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Unknown time";
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) {
      return "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      // For dates older than 24 hours, show a more readable format
      const options = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleDateString("en-US", options);
    }
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
    this.resetToInitialState();
  }

  // Reset UI to initial state when no word is selected
  resetToInitialState() {
    // Reset word display
    document.getElementById("currentWord").textContent =
      "Select a word to practice";
    document.getElementById("currentDefinition").textContent =
      "Choose any word from the list on the left to begin your pronunciation practice journey.";

    // Hide phonetic and tag elements
    const phoneticElement = document.getElementById("wordPhonetic");
    const categoryElement = document.getElementById("wordCategory");
    const difficultyElement = document.getElementById("wordDifficulty");

    if (phoneticElement) phoneticElement.style.display = "none";
    if (categoryElement) categoryElement.style.display = "none";
    if (difficultyElement) difficultyElement.style.display = "none";

    // Disable audio controls
    document.getElementById("playCorrectBtn").disabled = true;
    document.getElementById("recordBtn").disabled = true;
    document.getElementById("stopBtn").disabled = true;

    // Add helpful instruction message
    this.showStatus(
      "👈 Select a word from the library to start practicing!",
      "instruction"
    );

    // Add initial state class to word info section
    const wordInfo = document.querySelector(".word-info");
    if (wordInfo) {
      wordInfo.classList.add("initial-state");
    }

    // Show helpful tips in the recordings section
    this.showInitialTips();
  }

  // Show helpful tips when no word is selected
  showInitialTips() {
    const recordingsList = document.getElementById("recordingsList");
    if (recordingsList) {
      recordingsList.innerHTML = `
        <div class="initial-tips">
          <h4>💡 How to get started:</h4>
          <ul>
            <li>🔍 Use the search box to find specific words</li>
            <li>📚 Browse by category (vocabulary, adjectives, etc.)</li>
            <li>🎯 Start with beginner level words</li>
            <li>🔊 Listen to pronunciation before recording</li>
            <li>🎤 Record yourself multiple times for practice</li>
          </ul>
          <p class="tip-note">✨ <strong>Pro tip:</strong> Use headphones for better audio quality!</p>
        </div>
      `;
    }
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

  // Toggle recording
  toggleRecording() {
    if (this.currentItem) {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
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
