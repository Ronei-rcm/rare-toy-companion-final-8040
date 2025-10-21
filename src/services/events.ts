import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Event = Tables<"events">;
export type EventInsert = TablesInsert<"events">;
export type EventUpdate = TablesUpdate<"events">;

export const eventsService = {
  async getAll() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("ativo", true)
      .order("data_evento", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getUpcoming() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("ativo", true)
      .gte("data_evento", now)
      .order("data_evento", { ascending: true })
      .limit(6);

    if (error) throw error;
    return data || [];
  },

  async create(event: EventInsert) {
    const { data, error } = await supabase
      .from("events")
      .insert(event)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, event: EventUpdate) {
    const { data, error } = await supabase
      .from("events")
      .update(event)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
};