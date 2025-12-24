import { Gift, Memory } from '../types';
import { supabase } from './supabase';

export const getGifts = async (): Promise<Gift[]> => {
  const { data, error } = await supabase
    .from('gifts')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching gifts:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    senderName: item.sender_name,
    recipientName: item.recipient_name,
    senderPhoto: item.sender_photo,
    message: item.message,
    type: item.type,
    color: item.color,
    createdAt: Number(item.created_at),
    aiBlessing: item.ai_blessing,
    isOpened: item.is_opened
  }));
};

export const saveGift = async (gift: Gift): Promise<void> => {
  const { error } = await supabase
    .from('gifts')
    .insert({
      id: gift.id,
      sender_name: gift.senderName,
      recipient_name: gift.recipientName,
      sender_photo: gift.senderPhoto,
      message: gift.message,
      type: gift.type,
      color: gift.color,
      created_at: gift.createdAt,
      ai_blessing: gift.aiBlessing,
      is_opened: gift.isOpened || false
    });

  if (error) {
    console.error('Error saving gift:', error);
    throw error;
  }
};

export const markGiftAsOpened = async (id: string, aiBlessing?: string): Promise<void> => {
  const updates: any = { is_opened: true };
  if (aiBlessing) {
    updates.ai_blessing = aiBlessing;
  }

  const { error } = await supabase
    .from('gifts')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error marking gift as opened:', error);
    throw error;
  }
};

export const clearGifts = async (): Promise<void> => {
  const { error } = await supabase
    .from('gifts')
    .delete()
    .neq('id', 'placeholder'); // Delete all rows

  if (error) {
    console.error('Error clearing gifts:', error);
  }
};


export const getMemories = async (): Promise<Memory[]> => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching memories:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    photoUrl: item.photo_url,
    message: item.message,
    senderName: item.sender_name,
    createdAt: new Date(item.created_at).getTime()
  }));
};

export const saveMemory = async (memory: Omit<Memory, 'id' | 'createdAt'>, file: File): Promise<void> => {
  // 1. Upload Photo
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('tree-photos')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('tree-photos')
    .getPublicUrl(filePath);

  // 2. Save Metadata
  const { error: dbError } = await supabase
    .from('memories')
    .insert({
      photo_url: publicUrl,
      message: memory.message,
      sender_name: memory.senderName
    });

  if (dbError) {
    throw dbError;
  }
};
