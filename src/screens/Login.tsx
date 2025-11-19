import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import useAuth from "../store/auth";

export default function Login({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async () => {
    setBusy(true); setErr("");
    try { await login(email, password); }
    catch (e: any) { setErr(e.message || "Login failed"); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ flex:1, padding:24, justifyContent:"center" }}>
      <Text style={{ fontSize:24, fontWeight:"700", marginBottom:16 }}>Welcome back</Text>
      {!!err && <Text style={{ color:"red", marginBottom:8 }}>{err}</Text>}
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address"
        value={email} onChangeText={setEmail}
        style={{ borderWidth:1, borderRadius:12, padding:12, marginBottom:12 }} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}
        style={{ borderWidth:1, borderRadius:12, padding:12, marginBottom:16 }} />
      <Pressable onPress={onSubmit} style={{ backgroundColor:"black", borderRadius:16, padding:14, alignItems:"center" }}>
        {busy ? <ActivityIndicator /> : <Text style={{ color:"white", fontWeight:"600" }}>Login</Text>}
      </Pressable>
      <Pressable onPress={() => navigation.navigate("Register")} style={{ marginTop:14 }}>
        <Text>New here? Create an account</Text>
      </Pressable>
    </View>
  );
}
