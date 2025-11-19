// src/screens/VendorDetail.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { SidebarToggle } from "../components/Sidebar";
import { COLORS } from "../theme/colors";
import api from "../api/api";
import useAuth from "../store/auth";

type Vendor = {
  id: number;
  owner_id: number | null;
  business_name: string;
  category: string | null;
  is_approved: boolean;
  created_at: string;
};

type Wedding = {
  id: number;
  title: string | null;
  date: string | null;
  venue: string | null;
  status: string | null;
};

export default function VendorDetail({ route, navigation }: any) {
  const { id } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWeddingId, setSelectedWeddingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setLoading(true);
      const [vendorRes, weddingsRes] = await Promise.all([
        api.get<Vendor>(`/vendors/${id}`),
        api.get<Wedding[]>("/weddings/my"),
      ]);
      setVendor(vendorRes.data);
      setWeddings(weddingsRes.data || []);
      if (weddingsRes.data && weddingsRes.data.length > 0) {
        setSelectedWeddingId(weddingsRes.data[0].id);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBook = async () => {
    if (!selectedWeddingId) {
      Alert.alert("Error", "Please select a wedding first");
      return;
    }

    try {
      setBooking(true);
      await api.post("/bookings", {
        wedding_id: selectedWeddingId,
        vendor_id: id,
        status: "pending",
      });
      Alert.alert(
        "Success",
        "Booking request sent! The vendor will review your request.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Bookings"),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.response?.data?.error || "Failed to create booking"
      );
    } finally {
      setBooking(false);
    }
  };

  const getCategoryIcon = (category: string | null): string => {
    if (!category) return "🏢";
    const cat = category.toLowerCase();
    if (cat.includes("photo")) return "📸";
    if (cat.includes("video")) return "🎥";
    if (cat.includes("cater")) return "🍽️";
    if (cat.includes("venue")) return "🏛️";
    if (cat.includes("decor")) return "🎨";
    if (cat.includes("music")) return "🎵";
    if (cat.includes("makeup")) return "💄";
    if (cat.includes("planner")) return "📋";
    return "🏢";
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SidebarToggle />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.purple.medium} />
          <Text style={styles.loadingText}>Loading vendor details…</Text>
        </View>
      </View>
    );
  }

  if (error || !vendor) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <SidebarToggle />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Vendor not found"}
          </Text>
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <SidebarToggle />
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vendor Info Card */}
        <View style={styles.vendorCard}>
          <View style={styles.vendorIconContainer}>
            <Text style={styles.vendorIcon}>
              {getCategoryIcon(vendor.category)}
            </Text>
          </View>
          <Text style={styles.vendorName}>
            {vendor.business_name || "Unnamed Business"}
          </Text>
          {vendor.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{vendor.category}</Text>
            </View>
          )}
        </View>

        {/* Booking Section */}
        <View style={styles.bookingSection}>
          <Text style={styles.sectionTitle}>Book This Vendor</Text>
          <Text style={styles.sectionSubtitle}>
            Select a wedding to book this vendor for
          </Text>

          {weddings.length === 0 ? (
            <View style={styles.noWeddingsContainer}>
              <Text style={styles.noWeddingsText}>
                You don't have any weddings yet. Create a wedding first to make
                a booking.
              </Text>
              <Pressable
                style={styles.createWeddingButton}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={styles.createWeddingButtonText}>
                  Go to Home
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.weddingSelector}>
                <Text style={styles.selectorLabel}>Select Wedding:</Text>
                {weddings.map((wedding) => (
                  <Pressable
                    key={wedding.id}
                    onPress={() => setSelectedWeddingId(wedding.id)}
                    style={[
                      styles.weddingOption,
                      selectedWeddingId === wedding.id &&
                        styles.weddingOptionSelected,
                    ]}
                  >
                    <View style={styles.weddingOptionContent}>
                      <Text style={styles.weddingOptionTitle}>
                        {wedding.title || "Untitled Wedding"}
                      </Text>
                      {wedding.date && (
                        <Text style={styles.weddingOptionDate}>
                          {new Date(wedding.date).toLocaleDateString()}
                        </Text>
                      )}
                      {wedding.venue && (
                        <Text style={styles.weddingOptionVenue}>
                          📍 {wedding.venue}
                        </Text>
                      )}
                    </View>
                    {selectedWeddingId === wedding.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleBook}
                disabled={booking || !selectedWeddingId}
                style={[
                  styles.bookButton,
                  (booking || !selectedWeddingId) && styles.bookButtonDisabled,
                ]}
              >
                {booking ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.bookButtonText}>Book Vendor</Text>
                )}
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray.light,
  },
  header: {
    backgroundColor: COLORS.purple.medium,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.gray.dark,
    fontSize: 15,
  },
  errorContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.error.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error.medium,
    margin: 20,
  },
  errorText: {
    color: COLORS.error.dark,
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: COLORS.error.dark,
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  vendorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.purple.light,
  },
  vendorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.purple.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  vendorIcon: {
    fontSize: 40,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 12,
    textAlign: "center",
  },
  categoryBadge: {
    backgroundColor: COLORS.purple.light,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryText: {
    color: COLORS.purple.medium,
    fontSize: 14,
    fontWeight: "600",
  },
  bookingSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.purple.light,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.gray.dark,
    marginBottom: 20,
  },
  noWeddingsContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  noWeddingsText: {
    fontSize: 15,
    color: COLORS.gray.dark,
    textAlign: "center",
    marginBottom: 20,
  },
  createWeddingButton: {
    backgroundColor: COLORS.purple.medium,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  createWeddingButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
  weddingSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray.darker,
    marginBottom: 12,
  },
  weddingOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray.medium,
    marginBottom: 12,
    backgroundColor: COLORS.gray.light,
  },
  weddingOptionSelected: {
    borderColor: COLORS.purple.medium,
    backgroundColor: COLORS.purple.light,
  },
  weddingOptionContent: {
    flex: 1,
  },
  weddingOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 4,
  },
  weddingOptionDate: {
    fontSize: 14,
    color: COLORS.gray.dark,
    marginBottom: 2,
  },
  weddingOptionVenue: {
    fontSize: 13,
    color: COLORS.gray.dark,
  },
  checkmark: {
    fontSize: 24,
    color: COLORS.purple.medium,
    fontWeight: "700",
    marginLeft: 12,
  },
  bookButton: {
    backgroundColor: COLORS.purple.medium,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.purple.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
});

