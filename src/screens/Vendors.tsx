// src/screens/Vendors.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
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
  owner_id: number | null;
  business_name: string;
  category: string | null;
  is_approved: boolean;
  created_at: string;
};

const CATEGORIES = [
  "All",
  "Photographer",
  "Videographer",
  "Catering",
  "Venue",
  "Decoration",
  "Music",
  "Makeup Artist",
  "Wedding Planner",
  "Other",
];

export default function Vendors({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setLoading(true);
      const response = await api.get<Vendor[]>("/vendors");
      const allVendors = response.data || [];
      // Only show approved vendors
      const approvedVendors = allVendors.filter((v) => v.is_approved);
      setVendors(approvedVendors);
      setFilteredVendors(approvedVendors);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let filtered = vendors;

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (v) => v.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.business_name?.toLowerCase().includes(query) ||
          v.category?.toLowerCase().includes(query)
      );
    }

    setFilteredVendors(filtered);
  }, [vendors, selectedCategory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <SidebarToggle />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Browse Vendors</Text>
            <Text style={styles.headerSubtitle}>
              Find the perfect vendors for your wedding
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            placeholderTextColor={COLORS.gray.dark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {CATEGORIES.map((category) => (
          <Pressable
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.categoryPill,
              selectedCategory === category && styles.categoryPillActive,
            ]}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === category && styles.categoryPillTextActive,
              ]}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Body */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.purple.medium}
            colors={[COLORS.purple.medium]}
          />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading / Error */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.purple.medium} />
            <Text style={styles.loadingText}>Loading vendors…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={load} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredVendors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No vendors found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedCategory !== "All"
                ? "Try adjusting your search or filters"
                : "No vendors available at the moment"}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filteredVendors.length} vendor{filteredVendors.length !== 1 ? "s" : ""} found
              </Text>
            </View>

            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onPress={() => navigation.navigate("VendorDetail", { id: vendor.id })}
              />
            ))}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- Vendor Card Component ---------- */

function VendorCard({
  vendor,
  onPress,
}: {
  vendor: Vendor;
  onPress: () => void;
}) {
  const categoryIcon = getCategoryIcon(vendor.category);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.vendorCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.vendorCardContent}>
        <View style={styles.vendorIconContainer}>
          <Text style={styles.vendorIcon}>{categoryIcon}</Text>
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {vendor.business_name || "Unnamed Business"}
          </Text>
          {vendor.category && (
            <View style={styles.vendorCategoryContainer}>
              <Text style={styles.vendorCategory}>{vendor.category}</Text>
            </View>
          )}
        </View>
        <View style={styles.vendorArrowContainer}>
          <Text style={styles.vendorArrow}>→</Text>
        </View>
      </View>
    </Pressable>
  );
}

function getCategoryIcon(category: string | null): string {
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
    marginBottom: 16,
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
  searchContainer: {
    marginTop: 8,
  },
  searchInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.gray.darker,
  },
  categoryScroll: {
    maxHeight: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray.medium,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.gray.light,
    borderWidth: 1.5,
    borderColor: COLORS.gray.medium,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: COLORS.purple.medium,
    borderColor: COLORS.purple.medium,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray.darker,
  },
  categoryPillTextActive: {
    color: COLORS.white,
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
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray.dark,
    textAlign: "center",
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.gray.dark,
    fontWeight: "500",
  },
  vendorCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.purple.light,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  vendorCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.purple.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  vendorIcon: {
    fontSize: 28,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 6,
  },
  vendorCategoryContainer: {
    alignSelf: "flex-start",
  },
  vendorCategory: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.purple.medium,
    backgroundColor: COLORS.purple.light,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  vendorArrowContainer: {
    marginLeft: 12,
  },
  vendorArrow: {
    fontSize: 24,
    color: COLORS.purple.medium,
    fontWeight: "600",
  },
});

