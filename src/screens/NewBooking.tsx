// src/screens/NewBooking.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from "react-native";
import { SidebarToggle } from "../components/Sidebar";
import { COLORS } from "../theme/colors";
import api from "../api/api";

type Vendor = {
  id: number;
  business_name: string;
  category: string | null;
};

type Wedding = {
  id: number;
  title: string | null;
  date: string | null;
  venue: string | null;
};

export default function NewBooking({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
  const [selectedWeddingId, setSelectedWeddingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setLoading(true);
      const [vendorsRes, weddingsRes] = await Promise.all([
        api.get<Vendor[]>("/vendors"),
        api.get<Wedding[]>("/weddings/my"),
      ]);
      setVendors(vendorsRes.data || []);
      setWeddings(weddingsRes.data || []);
      if (weddingsRes.data && weddingsRes.data.length > 0) {
        setSelectedWeddingId(weddingsRes.data[0].id);
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredVendors = vendors.filter((v) =>
    v.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBook = async () => {
    if (!selectedVendorId || !selectedWeddingId) {
      setError("Please select both a vendor and a wedding");
      return;
    }

    try {
      setBooking(true);
      setError("");
      await api.post("/bookings", {
        wedding_id: selectedWeddingId,
        vendor_id: selectedVendorId,
        status: "pending",
      });
      navigation.navigate("Bookings");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to create booking");
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <SidebarToggle />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>New Booking</Text>
            <Text style={styles.headerSubtitle}>
              Select a vendor and wedding
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.purple.medium} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error && !booking ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Wedding Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Wedding</Text>
            {weddings.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>
                  You don't have any weddings yet.
                </Text>
              </View>
            ) : (
              <View style={styles.weddingList}>
                {weddings.map((wedding) => (
                  <Pressable
                    key={wedding.id}
                    onPress={() => setSelectedWeddingId(wedding.id)}
                    style={[
                      styles.weddingCard,
                      selectedWeddingId === wedding.id &&
                        styles.weddingCardSelected,
                    ]}
                  >
                    <Text style={styles.weddingCardTitle}>
                      {wedding.title || "Untitled Wedding"}
                    </Text>
                    {wedding.date && (
                      <Text style={styles.weddingCardDate}>
                        📅 {new Date(wedding.date).toLocaleDateString()}
                      </Text>
                    )}
                    {wedding.venue && (
                      <Text style={styles.weddingCardVenue}>
                        📍 {wedding.venue}
                      </Text>
                    )}
                    {selectedWeddingId === wedding.id && (
                      <Text style={styles.checkmark}>✓ Selected</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Vendor Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Vendor</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendors..."
              placeholderTextColor={COLORS.gray.dark}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {filteredVendors.length === 0 ? (
              <View style={styles.emptySection}>
                <Text style={styles.emptyText}>No vendors found</Text>
              </View>
            ) : (
              <View style={styles.vendorList}>
                {filteredVendors.map((vendor) => (
                  <Pressable
                    key={vendor.id}
                    onPress={() => {
                      setSelectedVendorId(vendor.id);
                      setError("");
                    }}
                    style={[
                      styles.vendorCard,
                      selectedVendorId === vendor.id &&
                        styles.vendorCardSelected,
                    ]}
                  >
                    <View style={styles.vendorCardContent}>
                      <Text style={styles.vendorIcon}>
                        {getCategoryIcon(vendor.category)}
                      </Text>
                      <View style={styles.vendorInfo}>
                        <Text style={styles.vendorName}>
                          {vendor.business_name}
                        </Text>
                        {vendor.category && (
                          <Text style={styles.vendorCategory}>
                            {vendor.category}
                          </Text>
                        )}
                      </View>
                      {selectedVendorId === vendor.id && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Book Button */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleBook}
            disabled={booking || !selectedVendorId || !selectedWeddingId}
            style={[
              styles.bookButton,
              (booking || !selectedVendorId || !selectedWeddingId) &&
                styles.bookButtonDisabled,
            ]}
          >
            {booking ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.bookButtonText}>Create Booking</Text>
            )}
          </Pressable>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
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
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.purple.light,
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
    padding: 20,
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray.darker,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray.medium,
  },
  weddingList: {
    gap: 12,
  },
  weddingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.gray.medium,
  },
  weddingCardSelected: {
    borderColor: COLORS.purple.medium,
    backgroundColor: COLORS.purple.light,
  },
  weddingCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 8,
  },
  weddingCardDate: {
    fontSize: 14,
    color: COLORS.gray.dark,
    marginBottom: 4,
  },
  weddingCardVenue: {
    fontSize: 14,
    color: COLORS.gray.dark,
  },
  vendorList: {
    gap: 12,
  },
  vendorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.gray.medium,
  },
  vendorCardSelected: {
    borderColor: COLORS.purple.medium,
    backgroundColor: COLORS.purple.light,
  },
  vendorCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 4,
  },
  vendorCategory: {
    fontSize: 14,
    color: COLORS.gray.dark,
  },
  checkmark: {
    fontSize: 20,
    color: COLORS.purple.medium,
    fontWeight: "700",
  },
  emptySection: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray.dark,
    textAlign: "center",
  },
  errorBanner: {
    backgroundColor: COLORS.error.light,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: COLORS.error.dark,
    fontSize: 14,
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

