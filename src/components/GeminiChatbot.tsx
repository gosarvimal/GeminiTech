import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Settings,
  ChevronDown,
  RotateCcw,
  Zap,
  Cpu,
  BrainCircuit,
} from 'lucide-react';
import { ChatMessage, GeminiModelId, PERSONA_ROLES } from '../types/chat';
import { AppState } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface GeminiChatbotProps {
  appDraft: AppState;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ appDraft }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const [model, setModel] = useState<GeminiModelId>('gemini-3.8-flash');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('prompt-specialist');
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>(
    'You are an intelligent AI assistant helping the user configure their HTML application.'
  );
  const [includeDraftContext, setIncludeDraftContext] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'model',
        content: `👋 **Hello! I'm your Gemini Prompt & Architecture Assistant.**\n\nI can help you:\n- **Review & refine** your application specifications\n- **Suggest robust validation rules** and edge cases\n- **Recommend optimal CDN libraries** (Chart.js, SheetJS, etc.)\n- **Generate test cases** and verify business logic\n\nAsk me anything, or tap one of the quick suggestions below!`,
        timestamp: Date.now(),
        model: 'gemini-3.8-flash',
      },
    ];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentRole = PERSONA_ROLES.find((r) => r.id === selectedRoleId) || PERSONA_ROLES[0];
  const activeSystemInstruction =
    selectedRoleId === 'custom'
      ? customSystemInstruction
      : currentRole.systemInstruction;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputPrompt).trim();
    if (!textToSend || isLoading) return;

    setErrorMessage(null);
    setInputPrompt('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Prepare assistant placeholder message for streaming
    const assistantMessageId = `model-${Date.now()}`;
    const initialAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
      model: model,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, initialAssistantMessage]);
    setIsLoading(true);

    // Abort controller for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Filter message history for API payload (skip initial welcome message)
    const historyPayload = updatedMessages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    const draftContext = includeDraftContext
      ? {
          appName: appDraft.appName,
          goal: appDraft.goal,
          audience: appDraft.audience,
          inputs: appDraft.inputs.map((inp) => ({
            title: inp.title,
            type: inp.type,
            required: inp.required,
            validation: inp.validation,
            choices: inp.choices,
            min: inp.min,
            max: inp.max,
            step: inp.step,
            detail: inp.detail,
          })),
          outputs: appDraft.outputs.map((out) => ({
            title: out.title,
            type: out.type,
            ai: out.ai,
            provider: out.provider,
            aiTask: out.aiTask,
            detail: out.detail,
          })),
          behaviorRules: appDraft.extraRules,
          persist: appDraft.persist,
          validate: appDraft.validate,
          librariesPolicy: appDraft.libraries,
          preferredLibraries: appDraft.libraryNames,
          visualStyle: appDraft.style,
          font: appDraft.font,
        }
      : null;

    try {
      // Attempt SSE streaming
      const response = await fetch('/api/gemini/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          model: model,
          systemInstruction: activeSystemInstruction,
          appDraftContext: draftContext,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // Fallback to standard chat endpoint if streaming route is unavailable
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this browser.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                streamedContent += parsed.text;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: streamedContent }
                      : msg
                  )
                );
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: msg.content + '\n\n*(Generation stopped by user)*',
                  isStreaming: false,
                }
              : msg
          )
        );
      } else {
        console.error('Chat error:', err);
        setErrorMessage(err?.message || 'Failed to get response from Gemini.');
        // Remove empty placeholder if nothing was streamed
        setMessages((prev) =>
          prev.filter((msg) => msg.id !== assistantMessageId || msg.content.length > 0)
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          content: `🧹 **Chat history cleared.** How can I assist you with your application specification?`,
          timestamp: Date.now(),
          model: model,
        },
      ]);
      setErrorMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    {
      label: '💡 Review current draft spec',
      prompt:
        'Please review my current draft application specification. Critique the inputs, validation presets, and outputs, and suggest any high-value improvements or edge cases I should consider.',
    },
    {
      label: '🔍 Suggest validation rules',
      prompt:
        'Based on the inputs configured in my draft, suggest specific validation rules, regex patterns, or boundary constraints to prevent invalid user data.',
    },
    {
      label: '📦 Recommend CDN libraries',
      prompt:
        'Given my desired outputs and functionality, what lightweight CDN libraries (e.g. SheetJS, Chart.js, jsPDF, Lucide) would you recommend, and what are their CDN script tags?',
    },
    {
      label: '🧪 Generate test scenarios',
      prompt:
        'Generate 5 comprehensive test cases (with sample input data and expected output/validation results) for my application draft.',
    },
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#1b2739',
            border: '2px solid #5ee1bd',
            borderRadius: '50px',
            color: '#fff',
            padding: '12px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          className="hover:scale-105 active:scale-95"
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(94, 225, 189, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5ee1bd',
            }}
          >
            <Sparkles size={16} />
          </div>
          <span style={{ fontWeight: 650, fontSize: '14px', letterSpacing: '0.02em' }}>
            Gemini Chatbot
          </span>
          <span
            style={{
              backgroundColor: '#111c2b',
              color: '#a9f3dc',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #3b5065',
            }}
          >
            3.8 Flash
          </span>
        </button>
      )}

      {/* Chat Drawer / Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: isExpanded ? '0' : '20px',
            right: isExpanded ? '0' : '20px',
            width: isExpanded ? '100vw' : '450px',
            maxWidth: '100vw',
            height: isExpanded ? '100vh' : '620px',
            maxHeight: '100vh',
            backgroundColor: '#152030',
            border: isExpanded ? 'none' : '1px solid #3b5065',
            borderRadius: isExpanded ? '0' : '16px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            overflow: 'hidden',
            transition: 'width 0.2s, height 0.2s, border-radius 0.2s',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: '#1b2739',
              borderBottom: '1px solid #2d3f56',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(94, 225, 189, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5ee1bd',
                }}
              >
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14.5px', color: '#fff' }}>
                  Gemini Prompt Assistant
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#5ee1bd',
                      display: 'inline-block',
                    }}
                  />
                  <span>{currentRole.name}</span>
                  <span>•</span>
                  <span style={{ color: '#a9f3dc' }}>{model}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  background: showSettings ? '#33445a' : 'transparent',
                  border: 'none',
                  color: showSettings ? '#5ee1bd' : '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="Chat Settings & Model Selection"
              >
                <Settings size={16} />
              </button>

              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="Clear Chat History"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Settings Drawer Panel */}
          {showSettings && (
            <div
              style={{
                backgroundColor: '#121b29',
                padding: '14px 16px',
                borderBottom: '1px solid #2d3f56',
                fontSize: '12.5px',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <label style={{ margin: '0 0 4px', fontSize: '12px', color: '#a9f3dc' }}>
                  Gemini Model:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setModel('gemini-3.8-flash')}
                    style={{
                      background: model === 'gemini-3.8-flash' ? '#274258' : '#1a2536',
                      borderColor: model === 'gemini-3.8-flash' ? '#5ee1bd' : '#33445a',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: model === 'gemini-3.8-flash' ? '#5ee1bd' : '#cbd5e1',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <BrainCircuit size={14} />
                    <span>3.8 Flash</span>
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>General</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModel('gemini-3.1-flash-lite')}
                    style={{
                      background: model === 'gemini-3.1-flash-lite' ? '#274258' : '#1a2536',
                      borderColor: model === 'gemini-3.1-flash-lite' ? '#5ee1bd' : '#33445a',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: model === 'gemini-3.1-flash-lite' ? '#5ee1bd' : '#cbd5e1',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Zap size={14} />
                    <span>3.1 Lite</span>
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>Fast</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModel('gemini-4-argon')}
                    style={{
                      background: model === 'gemini-4-argon' ? '#274258' : '#1a2536',
                      borderColor: model === 'gemini-4-argon' ? '#5ee1bd' : '#33445a',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      color: model === 'gemini-4-argon' ? '#5ee1bd' : '#cbd5e1',
                      fontSize: '11px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Cpu size={14} />
                    <span>4 Argon</span>
                    <span style={{ fontSize: '9px', opacity: 0.8 }}>Complex</span>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ margin: '0 0 4px', fontSize: '12px', color: '#a9f3dc' }}>
                  Assistant Role / Persona:
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    fontSize: '12px',
                    backgroundColor: '#1b2739',
                    borderColor: '#33445a',
                  }}
                >
                  {PERSONA_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.description}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRoleId === 'custom' && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ margin: '0 0 4px', fontSize: '12px', color: '#a9f3dc' }}>
                    Custom System Instruction:
                  </label>
                  <textarea
                    rows={2}
                    style={{
                      fontSize: '11.5px',
                      padding: '6px 8px',
                      minHeight: '60px',
                      backgroundColor: '#1b2739',
                    }}
                    value={customSystemInstruction}
                    onChange={(e) => setCustomSystemInstruction(e.target.value)}
                    placeholder="Provide specific persona or formatting rules..."
                  />
                </div>
              )}

              <div className="check" style={{ margin: '4px 0' }}>
                <input
                  type="checkbox"
                  id="include-draft-context"
                  checked={includeDraftContext}
                  onChange={(e) => setIncludeDraftContext(e.target.checked)}
                />
                <label htmlFor="include-draft-context" style={{ fontSize: '12px' }}>
                  Include current draft spec in context (application name, inputs, outputs)
                </label>
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px',
                      fontSize: '11px',
                      color: '#8295ab',
                    }}
                  >
                    <span>{isUser ? 'You' : 'Gemini'}</span>
                    {msg.model && !isUser && (
                      <span
                        style={{
                          backgroundColor: '#1b2739',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          color: '#a9f3dc',
                          border: '1px solid #2d3f56',
                        }}
                      >
                        {msg.model}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      maxWidth: isUser ? '85%' : '92%',
                      backgroundColor: isUser ? '#2563eb' : '#1c293c',
                      color: '#fff',
                      padding: '10px 14px',
                      borderRadius: isUser
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                      border: isUser ? 'none' : '1px solid #34485e',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {isUser ? (
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px' }}>
                        {msg.content}
                      </div>
                    ) : (
                      <>
                        <MarkdownRenderer content={msg.content} />
                        {msg.isStreaming && (
                          <span
                            style={{
                              display: 'inline-block',
                              width: '6px',
                              height: '14px',
                              backgroundColor: '#5ee1bd',
                              marginLeft: '4px',
                              animation: 'pulse 1s infinite',
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && !messages[messages.length - 1]?.isStreaming && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#5ee1bd',
                  fontSize: '12px',
                  padding: '6px 10px',
                  backgroundColor: '#1b2739',
                  borderRadius: '8px',
                  alignSelf: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#5ee1bd',
                    animation: 'pulse 1.2s infinite',
                  }}
                />
                Gemini is thinking...
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fca5a5',
                  fontSize: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  <RotateCcw size={12} /> Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: '#141d2b',
              borderTop: '1px solid #27374b',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                disabled={isLoading}
                style={{
                  background: '#1e2b3d',
                  border: '1px solid #33445a',
                  color: '#99e3cf',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '14px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Footer Input Area */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: '#1b2739',
              borderTop: '1px solid #2d3f56',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              rows={1}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Gemini to refine specs, suggest rules, or review code..."
              style={{
                flex: 1,
                minHeight: '40px',
                maxHeight: '120px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                backgroundColor: '#111c2b',
                border: '1px solid #45566c',
                resize: 'none',
                color: '#fff',
              }}
            />

            {isLoading ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="danger"
                style={{
                  padding: '9px 14px',
                  fontSize: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '40px',
                }}
                title="Stop response"
              >
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim()}
                style={{
                  padding: '9px 14px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: !inputPrompt.trim() ? 0.5 : 1,
                  cursor: !inputPrompt.trim() ? 'not-allowed' : 'pointer',
                  height: '40px',
                }}
                title="Send message (Enter)"
              >
                <Send size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
