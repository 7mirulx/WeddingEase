// src/screens/Bookings.tsx
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SidebarToggle } from "../components/Sidebar";
import { COLORS } from "../theme/colors";
import api from "../api/api";
import useAuth from "../store/auth";

type Booking = {
  id: number;
  wedding_id: number | null;
  vendor_id: number | null;
  status: string;
  price: number | null;
  created_at: string;
  // Joined data
  wedding?: {
    id: number;
    title: string | null;
    date: string | null;
    venue: string | null;
    status: string | null;
  };
  vendor?: {
    id: number;
    business_name: string | null;
    category: string | null;
  };
};

const STATUS_FILTERS = ["All", "pending", "confirmed", "completed", "cancelled"];

export default function Bookings({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    
    setError("");
    try {
      setLoading(true);
      const response = await api.get<Booking[]>("/bookings/my");
      const allBookings = response.data || [];
      setBookings(allBookings);
      setFilteredBookings(allBookings);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (selectedStatus === "All") {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(
        bookings.filter((b) => b.status?.toLowerCase() === selectedStatus.toLowerCase())
      );
    }
  }, [bookings, selectedStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date TBD";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Price TBD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "confirmed") return COLORS.purple.medium;
    if (s === "completed") return "#10B981";
    if (s === "cancelled") return "#EF4444";
    return COLORS.gray.dark; // pending
  };

  const getStatusBgColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "confirmed") return COLORS.purple.light;
    if (s === "completed") return "#D1FAE5";
    if (s === "cancelled") return "#FEE2E2";
    return COLORS.gray.medium; // pending
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <SidebarToggle />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>
              Manage your wedding bookings
            </Text>
          </View>
        </View>
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusScroll}
        contentContainerStyle={styles.statusContainer}
      >
        {STATUS_FILTERS.map((status) => (
          <Pressable
            key={status}
            onPress={() => setSelectedStatus(status)}
            style={[
              styles.statusPill,
              selectedStatus === status && styles.statusPillActive,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                selectedStatus === status && styles.statusPillTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
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
            <Text style={styles.loadingText}>Loading bookings…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={load} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>
              {selectedStatus !== "All"
                ? `No ${selectedStatus} bookings at the moment`
                : "You don't have any bookings yet. Create a new booking to get started!"}
            </Text>
            {selectedStatus === "All" && (
              <Pressable
                style={styles.emptyButton}
                onPress={() => navigation.navigate("Home")}
              >
                <Text style={styles.emptyButtonText}>Go to Home</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""}
              </Text>
            </View>

            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                formatDate={formatDate}
                formatPrice={formatPrice}
                getStatusColor={getStatusColor}
                getStatusBgColor={getStatusBgColor}
                onPress={() => navigation.navigate("BookingDetail", { id: booking.id })}
              />
            ))}

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- Booking Card Component ---------- */

function BookingCard({
  booking,
  formatDate,
  formatPrice,
  getStatusColor,
  getStatusBgColor,
  onPress,
}: {
  booking: Booking;
  formatDate: (date: string | null) => string;
  formatPrice: (price: number | null) => string;
  getStatusColor: (status: string) => string;
  getStatusBgColor: (status: string) => string;
  onPress: () => void;
}) {
  const weddingTitle = booking.wedding?.title || "Untitled Wedding";
  const weddingDate = booking.wedding?.date;
  const venue = booking.wedding?.venue;
  const vendorName = booking.vendor?.business_name || "Vendor TBD";
  const vendorCategory = booking.vendor?.category;
  const status = booking.status || "pending";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bookingCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.bookingCardHeader}>
        <View style={styles.bookingIconContainer}>
          <Text style={styles.bookingIcon}>📅</Text>
        </View>
        <View style={styles.bookingInfo}>
          <Text style={styles.bookingTitle} numberOfLines={1}>
            {weddingTitle}
          </Text>
          {vendorName && (
            <View style={styles.vendorRow}>
              <Text style={styles.vendorLabel}>Vendor:</Text>
              <Text style={styles.vendorName}>{vendorName}</Text>
              {vendorCategory && (
                <Text style={styles.vendorCategory}> • {vendorCategory}</Text>
              )}
            </View>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(status) },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(status) }]}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.bookingDetails}>
        {weddingDate && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📆</Text>
            <Text style={styles.detailText}>{formatDate(weddingDate)}</Text>
          </View>
        )}
        {venue && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>{venue}</Text>
          </View>
        )}
        {booking.price && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={styles.detailText}>{formatPrice(booking.price)}</Text>
          </View>
        )}
      </View>

      <View style={styles.bookingCardFooter}>
        <Text style={styles.viewDetailsText}>View details →</Text>
      </View>
    </Pressable>
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
  statusScroll: {
    maxHeight: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray.medium,
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  statusPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.gray.light,
    borderWidth: 1.5,
    borderColor: COLORS.gray.medium,
    marginRight: 8,
  },
  statusPillActive: {
    backgroundColor: COLORS.purple.medium,
    borderColor: COLORS.purple.medium,
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray.darker,
  },
  statusPillTextActive: {
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: COLORS.purple.medium,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
  },
  resultsHeader: {
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.gray.dark,
    fontWeight: "500",
  },
  bookingCard: {
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
  bookingCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bookingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.purple.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bookingIcon: {
    fontSize: 24,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray.darker,
    marginBottom: 6,
  },
  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  vendorLabel: {
    fontSize: 13,
    color: COLORS.gray.dark,
    marginRight: 4,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray.darker,
  },
  vendorCategory: {
    fontSize: 13,
    color: COLORS.gray.dark,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  bookingDetails: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray.medium,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray.darker,
    flex: 1,
  },
  bookingCardFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray.medium,
  },
  viewDetailsText: {
    color: COLORS.purple.medium,
    fontWeight: "600",
    fontSize: 14,
  },
});

