// src/store/auth.ts
import { create } from "zustand";
import api from "../api/api";

type User = { id: number; name: string; email: string; role?: string } | null;

type State = {
  user: User;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const useAuth = create<State>((set) => ({
  user: null,
  token: null,

  login: async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      set({ user: res.data.user, token: res.data.token });
      api.setToken(res.data.token);
    } catch (e: any) {
      console.log("LOGIN ERR:", e?.response?.status, e?.response?.data || e?.message);
      throw new Error(e?.response?.data?.error || "Network / server error");
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      set({ user: res.data.user, token: res.data.token });
      api.setToken(res.data.token);
    } catch (e: any) {
      console.log("REGISTER ERR:", e?.response?.status, e?.response?.data || e?.message);
      throw new Error(e?.response?.data?.error || "Network / server error");
    }
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, token: null });
  },
}));

export default useAuth;
