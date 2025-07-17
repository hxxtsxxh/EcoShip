import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Send, Bot, User } from 'lucide-react-native';
import { geminiService } from '../services/gemini';

const ChatInterface = ({ userContext }) => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hi! I\'m your UPS shipping assistant. I can help you with shipping questions, carbon footprint information, and eco-friendly shipping tips. How can I help you today?',
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isLoading, fadeAnim]);

  // Auto-scroll when messages change (only auto-scroll if user is near bottom)
  React.useEffect(() => {
    if (messages.length > 1) { // Don't auto-scroll for initial message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [messages.length]); // Only trigger on message count change, not content

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Hide keyboard when sending message
    Keyboard.dismiss();

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const context = userContext ? JSON.stringify(userContext) : '';
      const response = await geminiService.getChatResponse(inputText.trim(), context);
      
      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble responding right now. Please try again later.',
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message) => (
    <View key={message.id} style={[
      styles.messageContainer, 
      message.isBot ? styles.botMessage : styles.userMessage
    ]}>
      <View style={styles.messageHeader}>
        <View style={[
          styles.avatarContainer,
          message.isBot ? styles.botAvatar : styles.userAvatar
        ]}>
          {message.isBot ? (
            <Bot size={16} color="#fff" />
          ) : (
            <User size={16} color="#fff" />
          )}
        </View>
        <Text style={[styles.senderText, { color: message.isBot ? '#666' : '#999' }]}>
          {message.isBot ? 'UPS Assistant' : 'You'}
        </Text>
        <Text style={[styles.timestamp, { color: message.isBot ? '#999' : '#666' }]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={[styles.messageText, { color: message.isBot ? '#2C3E50' : '#fff' }]}>
        {message.text}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        scrollEnabled={true}
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
        onTouchStart={() => {}}
      >
          {messages.map((message) => renderMessage(message))}
          
          {isLoading && (
            <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
              <View style={styles.loadingMessage}>
                <View style={styles.botAvatar}>
                  <Bot size={16} color="#fff" />
                </View>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask me about shipping or sustainability..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
                enablesReturnKeyAutomatically={true}
              />
              <TouchableOpacity
                style={[styles.sendButton, { 
                  opacity: inputText.trim() ? 1 : 0.5,
                  backgroundColor: inputText.trim() ? '#FF6B00' : '#ccc'
                }]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <Send size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingTop: 10,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 20,
    maxWidth: '85%',
  },
  botMessage: {
    alignSelf: 'flex-start',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    borderBottomRightRadius: 5,
    padding: 16,
    marginLeft: 40,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  botAvatar: {
    backgroundColor: '#FF6B00',
  },
  userAvatar: {
    backgroundColor: '#007AFF',
  },
  senderText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 42,
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderBottomLeftRadius: 5,
    padding: 16,
    marginLeft: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12, // Account for home indicator on iOS
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 44, // Minimum height for better touch target
    maxHeight: 120, // Increased max height for multiline
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1F2937',
    textAlignVertical: 'top', // For Android multiline alignment
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ChatInterface;
