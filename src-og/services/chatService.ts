
import { supabase } from './supabaseClient';
import { ChatConversation, ChatMessage, User, ThreadContextType } from '../types';

export const chatService = {
  /**
   * Fetch all conversations for the current user, including participants and the last message.
   */
  getConversations: async (userId: string): Promise<ChatConversation[]> => {
    // 1. Get all conversation IDs the user is part of
    const { data: participation, error: pError } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (pError || !participation) return [];

    const conversationIds = participation.map(p => p.conversation_id);
    if (conversationIds.length === 0) return [];

    // 2. Fetch conversation details
    const { data: convos, error: cError } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false });

    if (cError || !convos) return [];

    // 3. Hydrate with participants and last message
    const hydrated = await Promise.all(convos.map(async (c) => {
      // Get Participants (excluding self usually, but helpful to have all)
      const { data: parts } = await supabase
        .from('chat_participants')
        .select('user_id, user:user_profiles(*)')
        .eq('conversation_id', c.id);

      const participants = parts?.map((p: any) => p.user) || [];

      // Get Last Message
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // MOCK: Add Context Data if missing from DB (for demo purposes)
      // In production, these fields would be in the 'chat_conversations' table schema
      const contextType = (c as any).context_type || 'CONCEPT';
      const contextTitle = (c as any).context_title || 'General Concept Discussion';
      const status = (c as any).status || 'ACTIVE';

      return {
        ...c,
        contextType,
        contextTitle,
        status,
        participants,
        last_message: lastMsg || null
      } as ChatConversation;
    }));

    return hydrated;
  },

  /**
   * Get messages for a specific conversation
   */
  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:user_profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data as ChatMessage[];
  },

  /**
   * Send a message
   */
  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        content
      }])
      .select('*, sender:user_profiles(*)')
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as ChatMessage;
  },

  /**
   * Start a new Context Thread
   * Requires Context details to enforce "No Empty DMs"
   */
  startContextThread: async (
    myId: string, 
    otherUserId: string, 
    context: { type: ThreadContextType; id: string; title: string }
  ): Promise<ChatConversation | null> => {
    
    // Create new conversation with Context Metadata
    // Note: We use the 'name' field to store JSON context for this demo since we can't alter DB schema dynamically
    // In a real migration, we'd have dedicated columns.
    const contextPayload = JSON.stringify(context);
    
    const { data: convo, error: cError } = await supabase
      .from('chat_conversations')
      .insert([{ 
          is_group: false,
          name: contextPayload // Storing context in name field for hacky persistence
      }])
      .select()
      .single();

    if (cError || !convo) return null;

    // Add participants
    await supabase.from('chat_participants').insert([
      { conversation_id: convo.id, user_id: myId },
      { conversation_id: convo.id, user_id: otherUserId }
    ]);

    // Return hydrated
    const { data: otherUser } = await supabase.from('user_profiles').select('*').eq('id', otherUserId).single();
    const { data: me } = await supabase.from('user_profiles').select('*').eq('id', myId).single();

    return {
      ...convo,
      contextType: context.type,
      contextTitle: context.title,
      contextId: context.id,
      status: 'ACTIVE',
      participants: [me, otherUser].filter(Boolean)
    };
  },

  /**
   * Search users to chat with
   */
  searchUsers: async (query: string, excludeId: string): Promise<User[]> => {
    if (!query) return [];
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .neq('id', excludeId)
      .ilike('name', `%${query}%`)
      .limit(5);
    
    return (data as any[]) || [];
  }
};
