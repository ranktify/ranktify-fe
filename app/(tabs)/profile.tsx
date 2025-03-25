import { useThemeColor } from "@/hooks/useThemeColor"
import { useRouter } from "expo-router"
import {
	Button,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native"
import { useAuth } from "../../contexts/AuthContext"

const statusBarHeight = Platform.OS === "ios" ? 50 : StatusBar.currentHeight

export default function ProfileScreen() {
	const router = useRouter()
	const textColor = useThemeColor({}, "text")
	const backgroundColor = useThemeColor({}, "background")

	const { user, loading, logout, isAuthenticated } = useAuth()

	const handleLogout = async () => {
		try {
			await logout()
		} catch (error) {
			console.error("Logout error:", error)
		}
	}

	if (loading) {
		return (
			<View style={[styles.loadingContainer, { backgroundColor }]}>
				<Text style={[styles.loadingText, { color: textColor }]}>
					Loading...
				</Text>
			</View>
		)
	}

	if (!isAuthenticated || !user) {
		return (
			<View style={[styles.container, { backgroundColor }]}>
				<View style={styles.welcomeContainer}>
					<Text style={[styles.title, { color: textColor }]}>
						Welcome to Ranktify
					</Text>
					<Text style={[styles.text, { color: textColor, marginBottom: 30 }]}>
						Please log in or sign up to continue
					</Text>

					<View style={styles.buttonContainer}>
						<Button
							title="Go to Login"
							onPress={() => router.push("/login")}
							color="#6200ee"
						/>
					</View>
					<View style={styles.buttonContainer}>
						<Button
							title="Go to Signup"
							onPress={() => router.push("/signup")}
							color="#03DAC6"
						/>
					</View>
				</View>
			</View>
		)
	}

	const getInitials = () => {
		if (!user || !user.username) return "?"
		return user.username.charAt(0).toUpperCase()
	}

	return (
		<ScrollView style={[styles.container, { backgroundColor }]}>
			<View style={styles.header}>
				<View style={styles.profileHeader}>
					<View style={styles.avatarContainer}>
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>{getInitials()}</Text>
						</View>
					</View>

					<View style={styles.statsContainer}>
						<View style={styles.statItem}>
							<Text style={[styles.statNumber, { color: textColor }]}>0</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: backgroundColor === "#fff" ? "#999" : "#aaa" },
								]}
							>
								Ranked
							</Text>
						</View>

						<View style={styles.statItem}>
							<Text style={[styles.statNumber, { color: textColor }]}>0</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: backgroundColor === "#fff" ? "#999" : "#aaa" },
								]}
							>
								Lists
							</Text>
						</View>

						<View style={styles.statItem}>
							<Text style={[styles.statNumber, { color: textColor }]}>0</Text>
							<Text
								style={[
									styles.statLabel,
									{ color: backgroundColor === "#fff" ? "#999" : "#aaa" },
								]}
							>
								Shared
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.profileContainer}>
					<Text style={[styles.label, { color: textColor }]}>Username</Text>
					<Text style={[styles.info, { color: textColor }]}>
						{user.username}
					</Text>

					<Text style={[styles.label, { color: textColor }]}>Email</Text>
					<Text style={[styles.info, { color: textColor }]}>{user.email}</Text>

					<Text style={[styles.label, { color: textColor }]}>User ID</Text>
					<Text style={[styles.info, { color: textColor }]}>{user.userId}</Text>
				</View>
			</View>

			<View
				style={[
					styles.contentSection,
					{ borderTopColor: backgroundColor === "#fff" ? "#DBDBDB" : "#444" },
				]}
			>
				<View
					style={[
						styles.sectionHeader,
						{
							borderBottomColor:
								backgroundColor === "#fff" ? "#DBDBDB" : "#444",
						},
					]}
				>
					<Text style={[styles.sectionTitle, { color: textColor }]}>
						Your Rankings
					</Text>
				</View>

				<View style={styles.emptyContent}>
					<Text style={[styles.text, { color: textColor }]}>
						You haven't ranked any songs yet.
					</Text>
					<TouchableOpacity
						style={styles.rankButton}
						onPress={() => router.push("/(tabs)/rank")}
					>
						<Text style={styles.rankButtonText}>Start Ranking</Text>
					</TouchableOpacity>
				</View>
			</View>

			<View style={styles.buttonContainer}>
				<Button title="Logout" onPress={handleLogout} color="#6200ee" />
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: statusBarHeight, // Added status bar padding
	},
	loadingContainer: {
		flex: 1,
		paddingTop: statusBarHeight, // Added status bar padding
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		fontSize: 18,
		textAlign: "center",
	},
	welcomeContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 8,
		textAlign: "center",
	},
	text: {
		fontSize: 18,
		textAlign: "center",
	},
	buttonContainer: {
		width: "100%",
		marginBottom: 15,
		padding: 10,
	},
	header: {
		padding: 20,
	},
	profileHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 20,
	},
	avatarContainer: {
		marginRight: 20,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#6200ee",
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		color: "#fff",
		fontSize: 32,
		fontWeight: "bold",
	},
	statsContainer: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-around",
	},
	statItem: {
		alignItems: "center",
	},
	statNumber: {
		fontSize: 18,
		fontWeight: "bold",
	},
	statLabel: {
		fontSize: 14,
		color: "#999",
	},
	profileContainer: {
		width: "100%",
		marginBottom: 30,
		padding: 5,
	},
	label: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 5,
	},
	info: {
		fontSize: 16,
		marginBottom: 20,
	},
	contentSection: {
		marginTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#DBDBDB",
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "center",
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#DBDBDB",
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "600",
	},
	emptyContent: {
		padding: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	rankButton: {
		backgroundColor: "#6200ee",
		borderRadius: 5,
		paddingVertical: 12,
		paddingHorizontal: 20,
		marginTop: 15,
	},
	rankButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
})
