import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaCode,
  FaProjectDiagram,
  FaBell,
  FaLock,
  FaCheck
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { doc, setDoc, getDoc, onSnapshot} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "./firebaseConfig";
import { getAuth } from "firebase/auth";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { Mail, Phone, Globe, Calendar, UploadCloud, Check, Eye, EyeOff, Lock, Save } from "react-feather";
import { LogOut, User, Star, Sparkles, Bell, Shield, Link2, Trash2, Camera, X } from 'lucide-react';
import { useToast } from "./ToastContext";

export default function ProfileSettingsPage() {
  // ==== STATES ====
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Profile states
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [major, setMajor] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

  // Skills states - FIX: Chỉ dùng một state cho skills
  const [skillsList, setSkillsList] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  // Projects states - FIX: Chỉ dùng một state cho projects
  const [projectsList, setProjectsList] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  // Security states
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [oldPwd, setOldPwd] = useState("");
  const [twoFA, setTwoFA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Notifications states - FIX: Sử dụng object thay vì các state riêng biệt
  const [notifications, setNotifications] = useState({
    email: false,
    push: false,
    marketing: false
  });

  const storage = getStorage();
  
  // FIX: Lấy userId từ Firebase Auth hoặc fallback
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // theo dõi trạng thái đăng nhập
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);   // <-- lấy uid thật từ Firebase
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ==== TOAST FUNCTION ====
  const { showToast } = useToast();

  // ==== LOAD DATA FROM FIREBASE ====
  useEffect(() => {
    if (!userId) {
        // Không có user thì khỏi fetch
        return;
    }

    const fetchData = async () => {
        try {
        setLoading(true);
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profile) {
            setAvatarUrl(data.profile.avatarUrl || "");
            setFullName(data.profile.fullName || "");
            setMajor(data.profile.major || "");
            setEmail(data.profile.email || "");
            setPhone(data.profile.phone || "");
            setBio(data.profile.bio || "");
            }

            setSkillsList(data.skills || []);
            setProjectsList(data.projects || []);
            setNotifications(
            data.notifications || { email: false, push: false, marketing: false }
            );
            setTwoFA(data.security?.twoFA || false);
            setWebsite(data.website || "");
        } else {
            console.log("No user document found, will create new one when saving");
        }
        } catch (error) {
        console.error("Error fetching data: ", error);
        showToast("Failed to load user data", "error");
        } finally {
        setLoading(false);
        }
    };

    fetchData();
    }, [userId, showToast]);

  // === LOGOUT FUNCTION ===
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast("Đăng xuất thành công!", "success");
    } catch (err) {
      showToast("Lỗi khi đăng xuất: " + err.message, "error");
    }
  };

  // ==== AVATAR UPLOAD FUNCTION ====
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    try {
      setLoading(true);
      
      // Create storage reference
      const storageRef = ref(storage, `avatars/${userId}/${file.name}`);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const url = await getDownloadURL(storageRef);

      // Update avatar URL in state
      setAvatarUrl(url);

      // Save to Firestore immediately
      await setDoc(
        doc(db, "users", userId),
        {
          profile: {
            avatarUrl: url,
            fullName,
            major,
            email,
            phone,
            bio
          }
        },
        { merge: true }
      );

      showToast("Avatar uploaded successfully", "success");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showToast("Failed to upload avatar", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==== SAVE FUNCTIONS ====
  
  // FIX: Save Profile Function
  const saveProfile = async () => {
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    try {
      setLoading(true);
      
      const profileData = {
        profile: {
          avatarUrl,
          fullName,
          major,
          email,
          phone,
          bio,
          website
        },
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", userId), profileData, { merge: true });
      
      setSaved(true);
      showToast("Profile updated successfully", "success");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast("Failed to save profile", "error");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Save Skills Function
  const saveSkills = async () => {
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    console.log("Saving skills for user:", userId);
    console.log("Skills data:", skillsList);

    try {
      setLoading(true);
      
      await setDoc(
        doc(db, "users", userId),
        {
          skills: skillsList,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      
      showToast("Skills updated successfully", "success");
    } catch (error) {
      console.error("Error saving skills:", error);
      showToast("Failed to save skills", "error");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Save Projects Function
  const saveProjects = async () => {
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    try {
      setLoading(true);
      
      await setDoc(
        doc(db, "users", userId),
        {
          projects: projectsList,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      
      showToast("Projects updated successfully", "success");
    } catch (error) {
      console.error("Error saving projects:", error);
      showToast("Failed to save projects", "error");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Save Notifications Function
  const saveNotifications = async () => {
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    try {
      setLoading(true);
      
      await setDoc(
        doc(db, "users", userId),
        {
          notifications,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      
      showToast("Notifications updated successfully", "success");
    } catch (error) {
      console.error("Error saving notifications:", error);
      showToast("Failed to save notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Save Security Function
  const saveSecurity = async () => {
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    // Validate password if changing
    if (newPwd && newPwd !== confirmPwd) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (newPwd && newPwd.length < 6) {
      showToast("New password must be at least 6 characters", "error");
      return;
    }

    try {
      setLoading(true);
      
      const securityData = {
        security: {
          twoFA,
          lastPasswordUpdate: newPwd ? new Date().toISOString() : null
        },
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", userId), securityData, { merge: true });
      
      // If password was changed, you might want to update Firebase Auth password here
      // using updatePassword from Firebase Auth
      
      showToast("Security settings updated successfully", "success");
      
      // Clear password fields
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (error) {
      console.error("Error saving security settings:", error);
      showToast("Failed to save security settings", "error");
    } finally {
      setLoading(false);
    }
  };

  // FIX: Save All Function
  const saveAll = async () => {
    if (!userId) {
      showToast("User not authenticated", "error");
      return;
    }

    try {
      setLoading(true);
      
      const allData = {
        profile: {
          avatarUrl,
          fullName,
          major,
          email,
          phone,
          bio,
          website
        },
        skills: skillsList,
        projects: projectsList,
        notifications,
        security: {
          twoFA
        },
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "users", userId), allData, { merge: true });
      
      setSaved(true);
      showToast("All settings saved successfully", "success");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving all data:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==== SKILL MANAGEMENT FUNCTIONS ====
  
  const addSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skillsList.includes(skillInput.trim())) {
      setSkillsList([...skillsList, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setSkillsList(skillsList.filter(s => s !== skill));
  };

  // ==== PROJECT MANAGEMENT FUNCTIONS ====
  
  const updateProject = (index, field, value) => {
    const updated = [...projectsList];
    updated[index][field] = value;
    setProjectsList(updated);
  };

  const saveProject = async (index) => {
    console.log("Saved project:", projectsList[index]);
    await saveProjects(); // Save to Firebase
    setOpenIndex(null);
  };

  const deleteProject = (index) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      const updated = [...projectsList];
      updated.splice(index, 1);
      setProjectsList(updated);
      showToast("Project deleted", "success");
      if (openIndex === index) setOpenIndex(null);
    }
  };

  const toggleProject = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const deleteUpload = (projectIndex, uploadIndex) => {
    setProjectsList(prev => {
      const updated = [...prev];
      updated[projectIndex].uploads.splice(uploadIndex, 1);
      return updated;
    });
  };

  const updateProjectUpload = (projectIndex, uploadIndex, key, value) => {
    setProjectsList(prev => {
      const updated = [...prev];
      if (!updated[projectIndex].uploads) {
        updated[projectIndex].uploads = [];
      }
      if (!updated[projectIndex].uploads[uploadIndex]) {
        updated[projectIndex].uploads[uploadIndex] = { type: "file", value: null };
      }
      updated[projectIndex].uploads[uploadIndex][key] = value;
      return updated;
    });
  };

  // ==== NOTIFICATION MANAGEMENT ====
  
  const updateNotification = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  // ==== COMPONENT HELPERS ====
  
  const TabButton = ({ value, icon: Icon, children, variant = "default" }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
        activeTab === value 
          ? variant === "danger"
            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );

  const Switch = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  // Loading overlay
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700">Saving...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-6xl px-3 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-gray-600 mt-1">Manage your personal information, security and notifications</p>
          </motion.div>
          
          <motion.div 
            className="hidden gap-3 md:flex"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <LogOut className="h-4 w-4"/>
              Sign out
            </button>
            <button 
              onClick={saveAll}
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                saved 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : saved ? (
                <Check className="h-4 w-4"/>
              ) : (
                <Save className="h-4 w-4"/>
              )}
              {loading ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
            </button>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Enhanced Sidebar */}
          <motion.aside 
            className="lg:sticky lg:top-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-600/10">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Settings
                </h3>
                <p className="text-gray-600 text-sm mt-1">Select a category to customize</p>
              </div>
              <div className="p-4 space-y-2">
                <TabButton value="profile" icon={User}>Profile</TabButton>
                <TabButton value="skills" icon={Star}>Skills</TabButton>
                <TabButton value="projects" icon={Sparkles}>Projects</TabButton>
                <TabButton value="notifications" icon={Bell}>Notifications</TabButton>
                <TabButton value="security" icon={Shield}>Security</TabButton>
                <TabButton value="connections" icon={Link2}>Connections</TabButton>
                <TabButton value="danger" icon={Trash2} variant="danger">Danger Zone</TabButton>
              </div>
            </div>
          </motion.aside>

          {/* Enhanced Main Content */}
          <main className="space-y-6">
            {/* Profile Section */}
            {activeTab === "profile" && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-600/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                    <p className="text-gray-600 text-sm mt-1">Update your personal details and avatar</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Public
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-600 p-1 shadow-lg">
                        <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-gray-700">
                              {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => document.getElementById("avatar-input")?.click()}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4"/>
                        Change Avatar
                      </button>
                      <input 
                        id="avatar-input" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload} 
                        disabled={loading}
                      />
                      <button 
                        onClick={() => setAvatarUrl("")}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4"/>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

                  {/* Form Fields */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Full Name</label>
                      <input 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Major</label>
                      <input 
                        value={major} 
                        onChange={(e) => setMajor(e.target.value)}
                        placeholder="Your field of study"
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                        <input 
                          type="email"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                        <input 
                          type="tel"
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+84 123 456 789"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Website</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                        <input 
                          type="url"
                          value={website} 
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Bio</label>
                      <textarea 
                        rows={4} 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={saveProfile}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="h-4 w-4"/>
                      )}
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Skills Section */}
            {activeTab === "skills" && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Header Card */}
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden">
                  <div className="p-6 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          Professional Skills
                        </h2>
                        <p className="text-gray-600 mt-2">Showcase your technical expertise and soft skills</p>
                      </div>
                      <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">
                          {skillsList.length} Skills Added
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add Skill Form */}
                  <div className="p-6 border-b border-gray-100">
                    <form onSubmit={addSkill} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="relative">
                          <input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            placeholder="E.g., React, Leadership, Problem Solving..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/80 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md text-gray-900 placeholder-gray-500"
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                          </div>
                        </div>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={loading}
                          className="px-6 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Skill
                        </motion.button>
                      </div>
                    </form>
                  </div>

                  {/* Quick Add Suggestions */}
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-blue-50/50">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        Quick Add Suggestions
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: "React", category: "tech", color: "from-blue-500 to-cyan-400" },
                        { name: "Node.js", category: "tech", color: "from-green-500 to-emerald-400" },
                        { name: "Python", category: "tech", color: "from-yellow-500 to-orange-400" },
                        { name: "Leadership", category: "soft", color: "from-purple-500 to-pink-400" },
                        { name: "Teamwork", category: "soft", color: "from-indigo-500 to-purple-400" },
                        { name: "Problem Solving", category: "soft", color: "from-red-500 to-pink-400" }
                      ].map((suggestion, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (!skillsList.includes(suggestion.name)) {
                              setSkillsList([...skillsList, suggestion.name]);
                              showToast(`Added ${suggestion.name} to skills`, "success");
                            }
                          }}
                          disabled={skillsList.includes(suggestion.name) || loading}
                          className={`px-3 py-1.5 bg-gradient-to-r ${suggestion.color} text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                            skillsList.includes(suggestion.name) || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                          }`}
                        >
                          + {suggestion.name}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skills Categories */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Technical Skills */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        Technical Skills
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">Programming languages, frameworks & tools</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 min-h-[120px]">
                        {skillsList
                          .filter(skill => {
                            const techSkills = ['React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'PHP', 'SQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'Vue.js', 'Angular', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'MySQL', 'PostgreSQL', 'Redis', 'Kubernetes', 'Jenkins', 'GraphQL', 'REST API', 'HTML', 'CSS', 'Sass', 'Webpack', 'Vite', 'Next.js', 'Nuxt.js'];
                            return techSkills.some(tech => skill.toLowerCase().includes(tech.toLowerCase())) || 
                                   skill.match(/^[A-Z][a-z]*\.?[jJ][sS]$/) ||
                                   skill.match(/\b(framework|library|database|cloud|api|sdk)\b/i);
                          })
                          .map((skill, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: i * 0.05 }}
                              className="group relative"
                            >
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300/50 transition-all duration-200 shadow-sm hover:shadow-md">
                                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
                                <span className="text-blue-800 font-medium text-sm">{skill}</span>
                                <motion.button
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeSkill(skill)}
                                  disabled={loading}
                                  className="w-5 h-5 rounded-full bg-blue-200/50 text-blue-600 hover:bg-red-200 hover:text-red-600 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        {skillsList.filter(skill => {
                          const techSkills = ['React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'PHP', 'SQL', 'MongoDB', 'Docker', 'AWS', 'Git', 'Vue.js', 'Angular', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'MySQL', 'PostgreSQL', 'Redis', 'Kubernetes', 'Jenkins', 'GraphQL', 'REST API', 'HTML', 'CSS', 'Sass', 'Webpack', 'Vite', 'Next.js', 'Nuxt.js'];
                          return !(techSkills.some(tech => skill.toLowerCase().includes(tech.toLowerCase())) || 
                                  skill.match(/^[A-Z][a-z]*\.?[jJ][sS]$/) || 
                                  skill.match(/\b(framework|library|database|cloud|api|sdk)\b/i));
                        }).length === skillsList.length && (
                          <div className="flex-1 flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <p className="text-sm text-gray-500">No technical skills added yet</p>
                              <p className="text-xs text-gray-400 mt-1">Add programming languages, frameworks & tools</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Soft Skills */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-400 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                          </svg>
                        </div>
                        Soft Skills
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">Communication, leadership & interpersonal skills</p>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex flex-wrap gap-2 min-h-[120px]">
                        {skillsList
                          .filter(skill => {
                            const softSkills = ['Leadership', 'Teamwork', 'Communication', 'Problem Solving', 'Critical Thinking', 'Time Management', 'Project Management', 'Public Speaking', 'Negotiation', 'Mentoring', 'Collaboration', 'Adaptability', 'Creativity', 'Analytical Thinking', 'Decision Making', 'Conflict Resolution', 'Emotional Intelligence', 'Customer Service', 'Presentation', 'Training', 'Planning', 'Organization'];
                            return softSkills.some(soft => skill.toLowerCase().includes(soft.toLowerCase())) ||
                                   skill.match(/\b(management|leadership|communication|speaking|thinking|skills?|ability)\b/i);
                          })
                          .map((skill, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: i * 0.05 }}
                              className="group relative"
                            >
                              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl hover:from-purple-100 hover:to-pink-100 hover:border-purple-300/50 transition-all duration-200 shadow-sm hover:shadow-md">
                                <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full"></div>
                                <span className="text-purple-800 font-medium text-sm">{skill}</span>
                                <motion.button
                                  whileHover={{ scale: 1.1, rotate: 90 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeSkill(skill)}
                                  disabled={loading}
                                  className="w-5 h-5 rounded-full bg-purple-200/50 text-purple-600 hover:bg-red-200 hover:text-red-600 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        {skillsList.filter(skill => {
                          const softSkills = ['Leadership', 'Teamwork', 'Communication', 'Problem Solving', 'Critical Thinking', 'Time Management', 'Project Management', 'Public Speaking', 'Negotiation', 'Mentoring', 'Collaboration', 'Adaptability', 'Creativity', 'Analytical Thinking', 'Decision Making', 'Conflict Resolution', 'Emotional Intelligence', 'Customer Service', 'Presentation', 'Training', 'Planning', 'Organization'];
                          return !(softSkills.some(soft => skill.toLowerCase().includes(soft.toLowerCase())) ||
                                  skill.match(/\b(management|leadership|communication|speaking|thinking|skills?|ability)\b/i));
                        }).length === skillsList.length && (
                          <div className="flex-1 flex items-center justify-center py-8">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                                </svg>
                              </div>
                              <p className="text-sm text-gray-500">No soft skills added yet</p>
                              <p className="text-xs text-gray-400 mt-1">Add communication, leadership & other skills</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* All Skills Overview */}
                {skillsList.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
                  >
                    <div className="p-6 bg-gradient-to-r from-gray-500/10 to-slate-500/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-gray-600 to-slate-600 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            All Skills Overview
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">Complete list of your professional skills</p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSkillsList([]);
                            showToast("All skills cleared", "success");
                          }}
                          disabled={loading}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear All
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex flex-wrap gap-3">
                        {skillsList.map((skill, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.02 }}
                            className="group relative"
                          >
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200/50 rounded-xl hover:from-gray-100 hover:to-slate-100 hover:border-gray-300/50 transition-all duration-200 shadow-sm hover:shadow-md">
                              <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-slate-500 rounded-full"></div>
                              <span className="text-gray-800 font-medium text-sm">{skill}</span>
                              <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeSkill(skill)}
                                disabled={loading}
                                className="w-5 h-5 rounded-full bg-gray-200/50 text-gray-600 hover:bg-red-200 hover:text-red-600 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-50"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveSkills}
                    disabled={loading}
                    className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="h-5 w-5"/>
                    )}
                    {loading ? 'Saving...' : 'Save Skills Profile'}
                  </motion.button>
                </div>
              </motion.section>
            )}

{/* Projects Section */}
            {activeTab === "projects" && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-500" />
                      Projects
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">Showcase your amazing projects</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {projectsList.length} Projects
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {projectsList.map((project, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="group bg-gradient-to-r from-white to-gray-50/50 border border-gray-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
                    >
                      {/* Enhanced Header */}
                      <div
                        onClick={() => toggleProject(index)}
                        className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200 border-b border-gray-100/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-md">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                              {project.name || `Project ${index + 1}`}
                            </span>
                            {project.desc && (
                              <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">
                                {project.desc}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(index);
                            }}
                            className="w-8 h-8 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-700 transition-all duration-200 flex items-center justify-center group/delete"
                          >
                            <Trash2 className="h-4 w-4 group-hover/delete:rotate-12 transition-transform duration-200" />
                          </motion.button>
                          
                          <motion.div
                            animate={{ rotate: openIndex === index ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </motion.div>
                        </div>
                      </div>

                      {/* Enhanced Project Body */}
                      <motion.div
                        initial={false}
                        animate={{
                          height: openIndex === index ? "auto" : 0,
                          opacity: openIndex === index ? 1 : 0
                        }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        {openIndex === index && (
                          <div className="p-6 space-y-6 bg-gradient-to-br from-white to-gray-50/30">
                            {/* Project Details */}
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <Star className="h-4 w-4 text-green-500" />
                                  Project Name
                                </label>
                                <input
                                  type="text"
                                  placeholder="My Awesome Project"
                                  value={project.name || ""}
                                  onChange={(e) => updateProject(index, "name", e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-blue-500" />
                                  Project Type
                                </label>
                                <select 
                                  value={project.type || "Web Application"}
                                  onChange={(e) => updateProject(index, "type", e.target.value)}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                  <option>Web Application</option>
                                  <option>Mobile App</option>
                                  <option>Desktop Software</option>
                                  <option>Game</option>
                                  <option>Other</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                Description
                              </label>
                              <textarea
                                rows={3}
                                placeholder="Describe your project, its features, and technologies used..."
                                value={project.desc || ""}
                                onChange={(e) => updateProject(index, "desc", e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none shadow-sm hover:shadow-md"
                              />
                            </div>

                            {/* Enhanced Uploads Section */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                  <UploadCloud className="h-5 w-5 text-indigo-500" />
                                  Project Files & Links
                                </h4>
                                <span className="text-sm text-gray-500">
                                  {project.uploads?.length || 0} items
                                </span>
                              </div>

                              {project.uploads?.map((upload, uploadIndex) => (
                                <motion.div 
                                  key={uploadIndex}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className="relative group/upload bg-gradient-to-r from-gray-50 to-white border border-gray-200/50 rounded-xl p-4 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-200"
                                >
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => deleteUpload(index, uploadIndex)}
                                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-700 transition-all duration-200 flex items-center justify-center opacity-0 group-hover/upload:opacity-100"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </motion.button>
                                  
                                  <div className="space-y-3 pr-8">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Type</label>
                                      <select
                                        value={upload.type || "file"}
                                        onChange={(e) => updateProjectUpload(index, uploadIndex, "type", e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                      >
                                        <option value="file">📁 File Upload</option>
                                        <option value="link">🔗 External Link</option>
                                        <option value="app">📱 Application</option>
                                      </select>
                                    </div>

                                    {upload.type === "file" && (
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Choose File</label>
                                        <div className="relative">
                                          <input
                                            type="file"
                                            onChange={(e) => updateProjectUpload(index, uploadIndex, "value", e.target.files[0])}
                                            className="w-full px-3 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-all duration-200 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                          />
                                          {upload.value && (
                                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
                                              <Check className="h-4 w-4 text-green-500" />
                                              {upload.value.name || "File uploaded"}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {upload.type === "link" && (
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Project URL</label>
                                        <div className="relative">
                                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                          <input
                                            type="url"
                                            placeholder="https://github.com/username/project"
                                            value={upload.value || ""}
                                            onChange={(e) => updateProjectUpload(index, uploadIndex, "value", e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {upload.type === "app" && (
                                      <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Application File</label>
                                        <input
                                          type="file"
                                          accept=".apk,.exe,.zip,.dmg"
                                          onChange={(e) => updateProjectUpload(index, uploadIndex, "value", e.target.files[0])}
                                          className="w-full px-3 py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 transition-all duration-200 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                        />
                                        {upload.value && (
                                          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 bg-purple-50 px-3 py-2 rounded-lg">
                                            <Check className="h-4 w-4 text-purple-500" />
                                            {upload.value.name || "App uploaded"}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              ))}

                              {/* Enhanced Add Upload Button */}
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  const updated = [...(project.uploads || [])];
                                  updated.push({ type: "file", value: null });
                                  updateProject(index, "uploads", updated);
                                }}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all duration-200 text-gray-600 hover:text-indigo-600 flex items-center justify-center gap-2 group"
                              >
                                <motion.div
                                  whileHover={{ rotate: 90 }}
                                  className="w-5 h-5 rounded-full bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                </motion.div>
                                Add File or Link
                              </motion.button>
                            </div>

                            {/* Enhanced Action Buttons */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
                              <div className="text-sm text-gray-500">
                                Last updated: {new Date().toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-3">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setOpenIndex(null)}
                                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center gap-2"
                                >
                                  Cancel
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => saveProject(index)}
                                  disabled={loading}
                                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 flex items-center gap-2 font-medium disabled:opacity-50"
                                >
                                  {loading ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                  {loading ? 'Saving...' : 'Save Project'}
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}

                  {/* Enhanced Add Project Button */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      setProjectsList([
                        ...projectsList,
                        { name: "", desc: "", type: "Web Application", uploads: [] }
                      ])
                    }
                    className="w-full py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 flex items-center justify-center gap-3 font-semibold group"
                  >
                    <motion.div
                      whileHover={{ rotate: 90 }}
                      className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                    <span>Create New Project</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="opacity-75"
                    >
                      →
                    </motion.div>
                  </motion.button>

                  {projectsList.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-dashed border-gray-200"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                      <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Start showcasing your work by creating your first project. Add files, links, and descriptions to impress visitors.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Save Projects Button */}
                <div className="px-6 pb-6">
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveProjects}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 font-medium disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="h-4 w-4"/>
                      )}
                      {loading ? 'Saving...' : 'Save All Projects'}
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Notifications Section */}
            {activeTab === "notifications" && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    Notification Preferences
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Choose how you want to be notified</p>
                </div>

                <div className="p-6 space-y-4">
                  {[
                    { 
                      key: 'email',
                      title: "Email Notifications", 
                      desc: "Receive updates in your inbox", 
                      icon: Mail,
                      checked: notifications.email
                    },
                    { 
                      key: 'push',
                      title: "Push Notifications", 
                      desc: "Show alerts on your device", 
                      icon: Bell,
                      checked: notifications.push
                    },
                    { 
                      key: 'marketing',
                      title: "Marketing & Updates", 
                      desc: "New features, offers and tips", 
                      icon: Star,
                      checked: notifications.marketing
                    }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{item.title}</div>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={item.checked} 
                        onChange={(value) => updateNotification(item.key, value)} 
                      />
                    </motion.div>
                  ))}

                  <div className="flex justify-end pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveNotifications}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 font-medium disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save className="h-4 w-4"/>
                      )}
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Security Section */}
            {activeTab === "security" && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-red-500/10 to-orange-500/10">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Security Settings
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Update your password and security preferences</p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                          type="password"
                          value={confirmPwd} 
                          onChange={(e) => setConfirmPwd(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">Two-Factor Authentication (2FA)</div>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                    </div>
                    <Switch checked={twoFA} onChange={setTwoFA} />
                  </div>

                  <div className="flex justify-end">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={saveSecurity}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 font-medium disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Lock className="h-4 w-4"/>
                      )}
                      {loading ? 'Updating...' : 'Update Security'}
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Connections Section */}
            {activeTab === "connections" && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/50 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-purple-500" />
                    Connected Apps
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Manage your third-party integrations</p>
                </div>

                <div className="p-6 space-y-4">
                  {[
                    { 
                      name: "Discord", 
                      status: "Connected", 
                      connected: true, 
                      color: "from-indigo-500 to-purple-600",
                      description: "Sync your Discord profile and activities"
                    },
                    { 
                      name: "Telegram", 
                      status: "Not connected", 
                      connected: false, 
                      color: "from-blue-400 to-blue-600",
                      description: "Get notifications through Telegram bot"
                    },
                    { 
                      name: "GitHub", 
                      status: "Connected", 
                      connected: true, 
                      color: "from-gray-700 to-gray-900",
                      description: "Import repositories and contributions"
                    },
                    { 
                      name: "LinkedIn", 
                      status: "Not connected", 
                      connected: false, 
                      color: "from-blue-600 to-blue-800",
                      description: "Share your professional achievements"
                    },
                  ].map((app, index) => (
                    <motion.div 
                      key={app.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/50 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${app.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200`}>
                          <Link2 className="h-6 w-6 text-white" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">{app.name}</div>
                          <p className="text-sm text-gray-600">{app.description}</p>
                          <p className={`text-xs font-medium ${app.connected ? 'text-green-600' : 'text-gray-500'}`}>
                            {app.status}
                          </p>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                          app.connected
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md'
                            : `bg-gradient-to-r ${app.color} text-white hover:shadow-lg hover:shadow-gray-500/25`
                        }`}
                      >
                        {app.connected ? (
                          <>
                            <X className="h-4 w-4" />
                            Disconnect
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4" />
                            Connect
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  ))}
                  
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Link2 className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">More Integrations Coming Soon</h3>
                    <p className="text-gray-500 mb-4 max-w-md mx-auto">
                      We're working on adding more platform integrations to help you connect all your accounts.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 font-medium"
                    >
                      Request Integration
                    </motion.button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Danger Zone */}
            {activeTab === "danger" && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-red-200/50 overflow-hidden"
              >
                <div className="p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10">
                  <h2 className="text-xl font-semibold text-red-600 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">Irreversible actions that affect your account</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Clear All Data */}
                  <div className="p-6 border-2 border-orange-200 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                          <Trash2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-orange-800 mb-2">Clear All Data</h3>
                          <p className="text-sm text-orange-600">
                            Remove all your profile information, skills, and projects. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (window.confirm("Are you sure you want to clear all your data? This action cannot be undone.")) {
                            // Clear all data
                            setFullName("");
                            setMajor("");
                            setEmail("");
                            setPhone("");
                            setBio("");
                            setWebsite("");
                            setAvatarUrl("");
                            setSkillsList([]);
                            setProjectsList([]);
                            setNotifications({ email: false, push: false, marketing: false });
                            showToast("All data cleared", "success");
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-200 font-medium flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4"/>
                        Clear Data
                      </motion.button>
                    </div>
                  </div>

                  {/* Export Data */}
                  <div className="p-6 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <UploadCloud className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-800 mb-2">Export Your Data</h3>
                          <p className="text-sm text-blue-600">
                            Download a copy of all your profile data in JSON format for backup or migration.
                          </p>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const exportData = {
                            profile: {
                              fullName,
                              major,
                              email,
                              phone,
                              bio,
                              website,
                              avatarUrl
                            },
                            skills: skillsList,
                            projects: projectsList,
                            notifications,
                            exportDate: new Date().toISOString()
                          };
                          
                          const dataStr = JSON.stringify(exportData, null, 2);
                          const dataBlob = new Blob([dataStr], { type: 'application/json' });
                          const url = URL.createObjectURL(dataBlob);
                          
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                          
                          showToast("Data exported successfully", "success");
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 font-medium flex-shrink-0"
                      >
                        <UploadCloud className="h-4 w-4"/>
                        Export Data
                      </motion.button>
                    </div>
                  </div>

                  {/* Delete Account */}
                  <div className="p-6 border-2 border-red-200 rounded-xl bg-gradient-to-r from-red-50 to-pink-50">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Trash2 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-800 mb-2">Delete Account</h3>
                          <p className="text-sm text-red-600">
                            Once you delete your account, there is no going back. Please be certain.
                          </p>
                          <div className="mt-2 text-xs text-red-500 bg-red-100 px-2 py-1 rounded-lg inline-block">
                            ⚠️ This action is permanent and cannot be undone
                          </div>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const confirmation = window.prompt(
                            "This will permanently delete your account and all data. Type 'DELETE' to confirm:"
                          );
                          if (confirmation === 'DELETE') {
                            showToast("Account deletion initiated", "error");
                            // Here you would typically call your account deletion API
                          } else if (confirmation !== null) {
                            showToast("Account deletion cancelled", "success");
                          }
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/25 transition-all duration-200 font-medium flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4"/>
                        Delete Account
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </main>
        </div>

        {/* Enhanced Mobile Actions */}
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/80 backdrop-blur-lg border-t border-gray-200/50 md:hidden">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const exportData = {
                  profile: {
                    fullName,
                    major,
                    email,
                    phone,
                    bio,
                    website,
                    avatarUrl
                  },
                  skills: skillsList,
                  projects: projectsList,
                  notifications,
                  exportDate: new Date().toISOString()
                };
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                showToast("Data exported successfully", "success");
              }}
              className="flex items-center gap-2 px-3 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors w-1/2 justify-center disabled:opacity-50"
              disabled={loading}
            >
              <UploadCloud className="h-4 w-4"/>
              Export
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveAll}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl font-medium transition-all duration-300 w-1/2 justify-center ${
                saved 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : saved ? (
                <Check className="h-4 w-4"/>
              ) : (
                <Save className="h-4 w-4"/>
              )}
              {loading ? 'Saving...' : saved ? 'Saved!' : 'Save All'}
            </motion.button>
          </div>
        </div>

        {/* Spacer for mobile */}
        <div className="h-20 md:hidden"></div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Save className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Saving Changes</h3>
                <p className="text-gray-600 text-sm">Please wait while we save your information...</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Animation */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-2xl flex items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"
              >
                <Check className="w-6 h-6" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-lg">Changes Saved!</h3>
                <p className="text-green-100 text-sm">Your profile has been updated successfully</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 md:hidden z-40"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={saveAll}
          disabled={loading}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : saved ? (
            <Check className="w-6 h-6" />
          ) : (
            <Save className="w-6 h-6" />
          )}
        </motion.button>
      </motion.div>

      {/* Keyboard Shortcuts Help */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="fixed bottom-6 left-6 hidden lg:block"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-white/50 p-3">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">S</kbd>
              <span>Save</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Background Particles Effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );

//   // Keyboard shortcuts handler
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.ctrlKey && e.key === "s") {
//         e.preventDefault();
//         saveAll();
//       }
//       if (e.key === "Escape") {
//         setOpenIndex(null); // Close any open modals or forms
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [saveAll]);

//   // Enhanced Security save function with password update
//   const saveSecurityEnhanced = async () => {
//     if (!userId) {
//       showToast("User not authenticated", "error");
//       return;
//     }

//     if (newPwd && newPwd !== confirmPwd) {
//       showToast("New passwords do not match", "error");
//       return;
//     }

//     if (newPwd && newPwd.length < 6) {
//       showToast("New password must be at least 6 characters", "error");
//       return;
//     }

//     try {
//       setLoading(true);

//       // Update Firebase Auth password if provided
//       if (newPwd && oldPwd) {
//         const user = auth.currentUser;
//         if (user) {
//           const credential = EmailAuthProvider.credential(user.email, oldPwd);
//           await reauthenticateWithCredential(user, credential);
//           await updatePassword(user, newPwd);
//         }
//       }

//       // Build security data
//       let history = [];
//       const snap = await getDoc(doc(db, "users", userId));
//       if (snap.exists()) {
//         history = snap.data().security?.passwordChangeHistory || [];
//       }

//       const securityData = {
//         security: {
//           twoFA,
//           lastPasswordUpdate: newPwd ? new Date().toISOString() : null,
//           passwordChangeHistory: newPwd
//             ? [...history, new Date().toISOString()].slice(-5) // keep last 5
//             : history,
//         },
//         updatedAt: new Date().toISOString(),
//       };

//       await setDoc(doc(db, "users", userId), securityData, { merge: true });

//       showToast("Security settings updated successfully", "success");
//       setOldPwd("");
//       setNewPwd("");
//       setConfirmPwd("");
//     } catch (error) {
//       console.error("Error saving security settings:", error);
//       if (error.code === "auth/wrong-password") {
//         showToast("Current password is incorrect", "error");
//       } else if (error.code === "auth/weak-password") {
//         showToast("New password is too weak", "error");
//       } else {
//         showToast("Failed to save security settings", "error");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Real-time sync with Firebase (always call the hook, check inside)
//   useEffect(() => {
//     if (!userId) return;

//     const unsubscribe = onSnapshot(
//       doc(db, "users", userId),
//       (docSnap) => {
//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           if (!loading) {
//             if (data.profile) {
//               setAvatarUrl(data.profile.avatarUrl || "");
//               setFullName(data.profile.fullName || "");
//               setMajor(data.profile.major || "");
//               setEmail(data.profile.email || "");
//               setPhone(data.profile.phone || "");
//               setBio(data.profile.bio || "");
//               setWebsite(data.profile.website || "");
//             }
//             setSkillsList(data.skills || []);
//             setProjectsList(data.projects || []);
//             setNotifications(
//               data.notifications || {
//                 email: false,
//                 push: false,
//                 marketing: false,
//               }
//             );
//             setTwoFA(data.security?.twoFA || false);
//           }
//         }
//       },
//       (error) => console.error("Error syncing data:", error)
//     );

//     return () => unsubscribe();
//   }, [userId, loading]);

//   // Auto-save functionality
//   useEffect(() => {
//     if (!userId) return;

//     const autoSaveInterval = setInterval(() => {
//       if (!loading) {
//         const autoSaveData = {
//           profile: {
//             avatarUrl,
//             fullName,
//             major,
//             email,
//             phone,
//             bio,
//             website,
//           },
//           skills: skillsList,
//           projects: projectsList,
//           notifications,
//           security: { twoFA },
//           lastAutoSave: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//         };

//         setDoc(doc(db, "users", userId), autoSaveData, { merge: true }).catch(
//           (error) => console.error("Auto-save failed:", error)
//         );
//       }
//     }, 30000); // every 30s

//     return () => clearInterval(autoSaveInterval);
//   }, [
//     userId,
//     avatarUrl,
//     fullName,
//     major,
//     email,
//     phone,
//     bio,
//     website,
//     skillsList,
//     projectsList,
//     notifications,
//     twoFA,
//     loading,
//   ]);
}