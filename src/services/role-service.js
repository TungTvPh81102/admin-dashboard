import { db } from "../firebase/firebaseConfig";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from "firebase/firestore";

export const roleService = {
  // Lấy tất cả roles
  getAllRoles: () => {
    return new Promise((resolve, reject) => {
      const unsubscribe = onSnapshot(
        collection(db, "roles"),
        (snapshot) => {
          const roles = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          resolve(roles);
        },
        (error) => {
          reject(error);
        }
      );
    });
  },

  // Thêm role mới
  addRole: async (roleData) => {
    try {
      const docRef = await addDoc(collection(db, "roles"), {
        ...roleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật role
  updateRole: async (roleId, roleData) => {
    try {
      const roleRef = doc(db, "roles", roleId);
      await updateDoc(roleRef, {
        ...roleData,
        updatedAt: new Date(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Xóa role
  deleteRole: async (roleId) => {
    try {
      await deleteDoc(doc(db, "roles", roleId));
    } catch (error) {
      throw error;
    }
  },

  // Lấy roles cho dropdown
  getRolesForSelect: async () => {
    try {
      const snapshot = await getDocs(collection(db, "roles"));
      return snapshot.docs.map((doc) => ({
        value: doc.data().name.toLowerCase(),
        label: doc.data().name,
        id: doc.id,
        permissions: doc.data().permissions,
      }));
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  },
};