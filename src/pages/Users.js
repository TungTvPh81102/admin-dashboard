import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { message, Button, Table, Modal, Form, Input, Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { roleService } from "../services/role-service";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }

    // Load users
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
      localStorage.setItem("users", JSON.stringify(userList));
    });

    // Load roles
    const loadRoles = async () => {
      try {
        const roleOptions = await roleService.getRolesForSelect();
        setRoles(roleOptions);
      } catch (error) {
        console.error("Error loading roles:", error);
        // Fallback to default roles if service fails
        setRoles([
          { value: "admin", label: "Admin" },
          { value: "user", label: "User" },
          { value: "moderator", label: "Moderator" },
        ]);
      }
    };

    loadRoles();

    return () => unsubscribeUsers();
  }, []);

  const handleAddOrUpdateUser = async (values) => {
    try {
      if (selectedUser) {
        const userRef = doc(db, "users", selectedUser.id);
        await updateDoc(userRef, values);
        message.success("Cập nhật người dùng thành công!");
      } else {
        await addDoc(collection(db, "users"), values);
        message.success("Thêm người dùng mới thành công!");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra!");
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      await deleteDoc(doc(db, "users", id));
      message.success("Xóa người dùng thành công!");
    }
  };

  const columns = [
    { title: "Họ tên", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Vai trò", dataIndex: "role", key: "role" },
    {
      title: "Hành động",
      key: "actions",
      render: (text, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => { 
            setSelectedUser(record); 
            form.setFieldsValue(record); 
            setIsModalVisible(true); 
          }} />
          <Button icon={<DeleteOutlined />} onClick={() => handleDeleteUser(record.id)} style={{ marginLeft: 8 }} danger />
        </>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: "1px solid #ddd" }}>
        <h1 style={{ margin: 0 }}>Users</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { 
          setSelectedUser(null); 
          form.resetFields(); 
          setIsModalVisible(true); 
        }}>
          Thêm User
        </Button>
      </div>

      <Table columns={columns} dataSource={users} rowKey="id" style={{ marginTop: 16 }} />

      <Modal 
        title={selectedUser ? "Chỉnh sửa User" : "Thêm User"} 
        open={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrUpdateUser}>
          <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}> 
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Vui lòng nhập email!" }]}> 
            <Input type="email" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}> 
            <Select placeholder="Chọn vai trò">
              {roles.map((role) => (
                <Select.Option key={role.value} value={role.value}>
                  {role.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
