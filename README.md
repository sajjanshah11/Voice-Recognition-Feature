# Voice Recognition Feature for eBook

A complete voice recognition system built with HTML, CSS, and JavaScript that helps users practice pronunciation with instant feedback.

## ✨ Features

### Core Functionality

- **Offline & Online Support**: Works in both modes without external dependencies
- **Local Data Storage**: All word data stored in local files (no database required)
- **Audio Recording**: Record up to 3 pronunciations with automatic cleanup
- **Instant Feedback**: Get immediate pronunciation accuracy scores
- **Speech Synthesis**: Uses browser's built-in text-to-speech for correct pronunciations

### UI/UX Features

- **Responsive Design**: Optimized for both portrait and landscape orientations
- **Search Functionality**: Find words/phrases by text, definition, or phonetic spelling
- **Modern Interface**: Beautiful gradient background with glassmorphism effects
- **Smooth Animations**: Fade-in and slide-up animations for better user experience
- **Keyboard Shortcuts**: Space to record, Enter to play, Escape to close modals

### Recording & Playback

- **Smart Recording Management**: Automatically manages up to 3 latest recordings
- **Auto-cleanup**: Older recordings deleted when limit exceeded
- **Session-based Storage**: All recordings cleared on app exit (no persistent storage)
- **High-quality Audio**: Echo cancellation and noise suppression enabled
- **Playback Controls**: Play your recordings and compare with correct pronunciation

## 🛠️ Technology Stack

- **HTML5**: Semantic markup with Web Audio API support
- **CSS3**: Modern styling with flexbox, grid, and responsive design
- **Vanilla JavaScript**: No external dependencies, using ES6+ features
- **Web APIs Used**:
  - MediaRecorder API for audio recording
  - Web Speech API for text-to-speech
  - getUserMedia API for microphone access

## 📋 Requirements

### Browser Support

- **Chrome/Edge**: 60+ (recommended)
- **Firefox**: 55+
- **Safari**: 11+
- **Mobile browsers**: iOS Safari 11+, Android Chrome 60+

### Permissions

- **Microphone access**: Required for voice recording
- **JavaScript**: Must be enabled

## 🚀 Setup Instructions

1. **Clone or Download** the files to your local directory
2. **Open `index.html`** in a modern web browser
3. **Allow microphone access** when prompted
4. **Start practicing** pronunciation!

### File Structure

```
voice-recognition-feature/
├── index.html          # Main HTML file
├── styles.css          # Comprehensive styling
├── script.js           # Main JavaScript functionality
├── data.js             # Local word/phrase data
└── README.md           # This file
```

## 📖 How to Use

### Getting Started

1. **Select a Word**: Click on any word card from the grid
2. **Listen First**: Click "Play Correct" to hear the proper pronunciation
3. **Record Yourself**: Click "Start Recording" and speak clearly
4. **Get Feedback**: Receive instant pronunciation accuracy scores
5. **Practice More**: Try different words and improve your scores

### Search Feature

- Type in the search box to find specific words
- Search works across:
  - Word/phrase text
  - Definitions
  - Categories
  - Phonetic spellings

### Recording Management

- **Maximum 3 recordings** per session
- **Automatic deletion** of oldest recordings when limit reached
- **Session-based storage** - all recordings cleared on app close
- **Individual playback** and deletion controls

### Keyboard Shortcuts

- **Space**: Start/Stop recording (when word selected)
- **Enter**: Play correct pronunciation (when word selected)
- **Escape**: Close help modal

## 🎯 Understanding Feedback

### Accuracy Scores

- **85%+ (Excellent)**: Outstanding pronunciation! 🎉
- **70-84% (Good)**: Very good with minor improvements needed 👍
- **50-69% (Needs Improvement)**: Keep practicing with provided tips 📚
- **<50%**: Focus on basic pronunciation patterns 🎯

### Feedback Features

- **Instant scoring**: Get results within 1 second
- **Personalized tips**: Receive improvement suggestions for lower scores
- **Difficulty-based scoring**: Beginner words get slight accuracy bonus

## 🔧 Customization

### Adding New Words

Edit `data.js` to add new words/phrases:

```javascript
{
    id: 16,
    word: "your-word",
    definition: "Your definition here",
    category: "your-category",
    difficulty: "beginner|intermediate|advanced",
    audioPath: "audio/your-audio.mp3",
    phonetic: "/your-phonetic-spelling/"
}
```

### Modifying Settings

Adjust configuration in `data.js`:

```javascript
config: {
    maxRecordings: 3,           // Maximum recordings to keep
    recordingDuration: 10,      // Auto-stop after seconds
    feedbackDelay: 1000,        // Delay before showing feedback
    accuracyThresholds: {       // Score thresholds
        excellent: 85,
        good: 70,
        needsImprovement: 50
    }
}
```

## 🎨 Styling Customization

The CSS is modular and easy to customize:

- **Colors**: Modify CSS custom properties at the top of `styles.css`
- **Layouts**: Responsive grid and flexbox layouts
- **Animations**: Customizable keyframe animations
- **Themes**: Easy to implement dark/light theme switching

## 🔒 Privacy & Security

- **No external servers**: All processing happens locally
- **No data persistence**: Recordings deleted on app exit
- **Microphone access**: Only used for recording, not transmitted anywhere
- **Browser-based**: No installations or plugins required

## 🐛 Troubleshooting

### Common Issues

**Microphone not working**:

- Check browser permissions
- Ensure microphone is not used by other applications
- Try refreshing the page

**No audio playback**:

- Check browser audio settings
- Ensure speakers/headphones are connected
- Verify Web Speech API support in browser

**Search not working**:

- Clear browser cache
- Check JavaScript is enabled
- Verify data.js is loaded properly

**Recording fails**:

- Grant microphone permissions
- Use HTTPS (required by some browsers)
- Check MediaRecorder API support

## 🚀 Future Enhancements

### Planned Features

- **Real audio files**: Replace speech synthesis with professional recordings
- **Advanced feedback**: More detailed pronunciation analysis
- **Progress tracking**: Session-based progress monitoring
- **Export recordings**: Download recordings for offline practice
- **Multiple languages**: Support for different language pronunciation

### Integration Options

- **LMS Integration**: Can be embedded in learning management systems
- **eBook Integration**: Designed for seamless eBook integration
- **Mobile App**: PWA-ready for mobile app deployment
- **API Integration**: Ready for external pronunciation analysis services

## 📄 License

This project is provided as-is for educational and practical use. Feel free to modify and adapt according to your needs.

## 🤝 Contributing

To contribute improvements:

1. Fork the repository
2. Make your changes
3. Test thoroughly across different browsers
4. Submit a pull request with detailed description

## 📞 Support

For technical support or questions:

- Check the troubleshooting section above
- Review browser console for error messages
- Ensure all files are properly loaded
- Verify microphone permissions are granted

---

**Enjoy practicing your pronunciation with instant feedback!** 🎙️✨
