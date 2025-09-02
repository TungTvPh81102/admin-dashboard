import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { 
  message, 
  Button, 
  Table, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Tag, 
  Checkbox,
  Space,
  Popconfirm
} from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined 
} from "@ant-design/icons";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from "firebase/firestore";

const { TextArea } = Input;

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Danh sách các quyền có thể có
  const availablePermissions = [
    { label: "Đọc", value: "read" },
    { label: "Ghi", value: "write" },
    { label: "Xóa", value: "delete" },
    { label: "Quản lý người dùng", value: "manage_users" },
    { label: "Quản lý sản phẩm", value: "manage_products" },
    { label: "Quản lý đơn hàng", value: "manage_orders" },
    { label: "Xem thống kê", value: "view_statistics" },
    { label: "Quản lý danh mục", value: "manage_categories" },
  ];

  useEffect(() => {
    const storedRoles = localStorage.getItem("roles");
    if (storedRoles) {
      setRoles(JSON.parse(storedRoles));
    }

    const unsubscribe = onSnapshot(collection(db, "roles"), (snapshot) => {
      const roleList = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setRoles(roleList);
      localStorage.setItem("roles", JSON.stringify(roleList));
    });

    return () => unsubscribe();
  }, []);

  const handleAddOrUpdateRole = async (values) => {
    setLoading(true);
    try {
      const roleData = {
        ...values,
        permissions: values.permissions || [],
        status: values.status || "active",
      };

      if (selectedRole) {
        const roleRef = doc(db, "roles", selectedRole.id);
        await updateDoc(roleRef, {
          ...roleData,
          updatedAt: new Date(),
        });
        message.success("Cập nhật vai trò thành công!");
      } else {
        await addDoc(collection(db, "roles"), {
          ...roleData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        message.success("Thêm vai trò mới thành công!");
      }
      
      setIsModalVisible(false);
      form.resetFields();
      setSelectedRole(null);
    } catch (error) {
      console.error("Error:", error);
      message.error("Có lỗi xảy ra!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId, roleName) => {
    try {
      await deleteDoc(doc(db, "roles", roleId));
      message.success(`Xóa vai trò "${roleName}" thành công!`);
    } catch (error) {
      console.error("Error:", error);
      message.error("Có lỗi xảy ra khi xóa vai trò!");
    }
  };

  const handleEditRole = (record) => {
    setSelectedRole(record);
    form.setFieldsValue({
      ...record,
      permissions: record.permissions || [],
    });
    setIsModalVisible(true);
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "Tên vai trò",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Quyền hạn",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions) => (
        <Space size={[0, 8]} wrap>
          {permissions?.map((permission) => {
            const permissionLabel = availablePermissions.find(
              (p) => p.value === permission
            )?.label || permission;
            return (
              <Tag key={permission} color="blue">
                {permissionLabel}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (text, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditRole(record)}
            type="primary"
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa vai trò"
            description={`Bạn có chắc chắn muốn xóa vai trò "${record.name}"?`}
            onConfirm={() => handleDeleteRole(record.id, record.name)}
            okText="Có"
            cancelText="Không"
          >
            <Button 
              icon={<DeleteOutlined />} 
              danger
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "16px 0", 
          borderBottom: "1px solid #f0f0f0",
          marginBottom: "16px"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px" }}>
            <UserOutlined style={{ marginRight: "8px" }} />
            Quản lý vai trò
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "#666" }}>
            Quản lý các vai trò và quyền hạn trong hệ thống
          </p>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddRole}
          size="large"
        >
          Thêm vai trò mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={roles} 
        rowKey="id" 
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} của ${total} vai trò`,
        }}
      />

      <Modal 
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <UserOutlined style={{ marginRight: "8px" }} />
            {selectedRole ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
          </div>
        }
        open={isModalVisible} 
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedRole(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleAddOrUpdateRole}
          style={{ marginTop: "16px" }}
        >
          <Form.Item 
            name="name" 
            label="Tên vai trò" 
            rules={[
              { required: true, message: "Vui lòng nhập tên vai trò!" },
              { min: 2, message: "Tên vai trò phải có ít nhất 2 ký tự!" }
            ]}
          > 
            <Input placeholder="Nhập tên vai trò" />
          </Form.Item>

          <Form.Item 
            name="description" 
            label="Mô tả" 
            rules={[
              { required: true, message: "Vui lòng nhập mô tả!" }
            ]}
          > 
            <TextArea 
              rows={3} 
              placeholder="Nhập mô tả về vai trò này"
            />
          </Form.Item>

          <Form.Item 
            name="permissions" 
            label="Quyền hạn"
            rules={[
              { required: true, message: "Vui lòng chọn ít nhất một quyền!" }
            ]}
          >
            <Checkbox.Group options={availablePermissions} />
          </Form.Item>

          <Form.Item 
            name="status" 
            label="Trạng thái" 
            rules={[
              { required: true, message: "Vui lòng chọn trạng thái!" }
            ]}
          > 
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Không hoạt động</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Roles;