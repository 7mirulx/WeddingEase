// src/screens/Home.tsx
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
import useAuth from "../store/auth";
import api from "../api/api";
import { SidebarToggle } from "../components/Sidebar";
import { COLORS } from "../theme/colors";

type Booking = {
  id: number;
  title: string;          // e.g. "Akad Nikah"
  date: string;           // ISO
  location?: string;
};

type Vendor = {
  id: number;
  name: string;
  category: string;       // e.g. "Photographer"
};

export default function Home({ navigation }: any) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setLoading(true);
      // These endpoints are placeholders—hook them to your backend when ready
      const [b, v] = await Promise.all([
        api.get<Booking[]>("/bookings/upcoming"),
        api.get<Vendor[]>("/vendors/top?limit=5"),
      ]);
      setBookings(b.data || []);
      setVendors(v.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to load home data");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, [load]);

  const firstName = (user?.name || "Guest").split(" ")[0];

  return (
    <View style={styles.container}>
      {/* Header with gradient effect */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <SidebarToggle />
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{firstName} 👋</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate("NewBooking")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>+ New Booking</Text>
          </Pressable>
          <Pressable
            onPress={logout}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </Pressable>
        </View>
      </View>

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
            <Text style={styles.loadingText}>Loading your dashboard…</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={load} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Upcoming Bookings */}
            <Section title="Upcoming Bookings" icon="📅">
              {bookings.length === 0 ? (
                <EmptyCard
                  text="No upcoming bookings yet."
                  cta="Create your first booking"
                  onPress={() => navigation.navigate("Register")}
                />
              ) : (
                bookings.slice(0, 3).map((b) => (
                  <BookingCard key={b.id} booking={b} navigation={navigation} />
                ))
              )}
            </Section>

            {/* Quick Actions */}
            <Section title="Quick Actions" icon="⚡">
              <View style={styles.quickActionsRow}>
                <QuickActionPill
                  icon="🏪"
                  label="Browse Vendors"
                  onPress={() => navigation.navigate("Vendors")}
                />
                <QuickActionPill
                  icon="💰"
                  label="Budget"
                  onPress={() => navigation.navigate("Budget")}
                />
                <QuickActionPill
                  icon="✅"
                  label="Checklist"
                  onPress={() => navigation.navigate("Checklist")}
                />
              </View>
            </Section>

            {/* Top Vendors */}
            <Section title="Top Vendors" icon="⭐">
              {vendors.length === 0 ? (
                <EmptyCard text="Vendors will appear here once you start browsing." />
              ) : (
                vendors.map((v) => (
                  <VendorCard key={v.id} vendor={v} navigation={navigation} />
                ))
              )}
            </Section>

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- UI Components ---------- */

function Section({
  title,
  icon,
  children,
}: React.PropsWithChildren<{ title: string; icon?: string }>) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function BookingCard({
  booking,
  navigation,
}: {
  booking: Booking;
  navigation: any;
}) {
  return (
    <Pressable
      onPress={() => navigation.navigate("BookingDetail", { id: booking.id })}
      style={({ pressed }) => [
        styles.bookingCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.bookingCardHeader}>
        <View style={styles.bookingIcon}>
          <Text style={styles.bookingIconText}>📅</Text>
        </View>
        <View style={styles.bookingCardContent}>
          <Text style={styles.bookingTitle}>{booking.title}</Text>
          <Text style={styles.bookingDate}>
            {formatDate(booking.date)}
            {booking.location ? ` • ${booking.location}` : ""}
          </Text>
        </View>
      </View>
      <View style={styles.bookingCardFooter}>
        <Text style={styles.viewDetailsText}>View details →</Text>
      </View>
    </Pressable>
  );
}

function QuickActionPill({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickActionPill,
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function VendorCard({
  vendor,
  navigation,
}: {
  vendor: Vendor;
  navigation: any;
}) {
  return (
    <Pressable
      onPress={() => navigation.navigate("VendorDetail", { id: vendor.id })}
      style={({ pressed }) => [
        styles.vendorCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.vendorCardContent}>
        <View style={styles.vendorIcon}>
          <Text style={styles.vendorIconText}>🏢</Text>
        </View>
        <View style={styles.vendorInfo}>
          <Text style={styles.vendorName}>{vendor.name}</Text>
          <Text style={styles.vendorCategory}>{vendor.category}</Text>
        </View>
        <Text style={styles.vendorArrow}>→</Text>
      </View>
    </Pressable>
  );
}

function EmptyCard({
  text,
  cta,
  onPress,
}: {
  text: string;
  cta?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyCardText}>{text}</Text>
      {cta && onPress && (
        <Pressable onPress={onPress} style={styles.emptyCardButton}>
          <Text style={styles.emptyCardButtonText}>{cta} →</Text>
        </Pressable>
      )}
    </View>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
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
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: COLORS.purple.light,
    fontWeight: "500",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: COLORS.purple.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: COLORS.purple.medium,
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 15,
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
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#DC2626",
    fontWeight: "600",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gray.darker,
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
  },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.purple.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bookingIconText: {
    fontSize: 20,
  },
  bookingCardContent: {
    flex: 1,
  },
  bookingTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: COLORS.gray.darker,
    marginBottom: 6,
  },
  bookingDate: {
    color: COLORS.gray.dark,
    fontSize: 14,
    lineHeight: 20,
  },
  bookingCardFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray.medium,
  },
  viewDetailsText: {
    color: COLORS.purple.medium,
    fontWeight: "600",
    fontSize: 14,
  },
  quickActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.purple.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  pillPressed: {
    backgroundColor: COLORS.purple.light,
    transform: [{ scale: 0.96 }],
  },
  quickActionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  quickActionLabel: {
    fontWeight: "600",
    color: COLORS.gray.darker,
    fontSize: 14,
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
    borderColor: COLORS.gray.medium,
  },
  vendorCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.purple.light,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vendorIconText: {
    fontSize: 24,
  },
  vendorInfo: {
    flex: 1,
  },
  vendorName: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.gray.darker,
    marginBottom: 4,
  },
  vendorCategory: {
    color: COLORS.gray.dark,
    fontSize: 14,
  },
  vendorArrow: {
    fontSize: 20,
    color: COLORS.purple.medium,
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray.medium,
    borderStyle: "dashed",
  },
  emptyCardText: {
    color: COLORS.gray.dark,
    fontSize: 15,
    textAlign: "center",
    marginBottom: 12,
  },
  emptyCardButton: {
    marginTop: 8,
  },
  emptyCardButtonText: {
    color: COLORS.purple.medium,
    fontWeight: "600",
    fontSize: 15,
  },
});
