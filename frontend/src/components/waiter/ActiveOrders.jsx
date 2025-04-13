import React, { useState } from 'react';
import { Card, ListGroup, Badge, Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import BillDisplay from './BillDisplay';

const ActiveOrders = ({ orders, onOrderUpdate, onPayment }) => {
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedTableOrders, setSelectedTableOrders] = useState(null);

    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Group orders by table
    const groupedOrders = orders.reduce((acc, order) => {
        if (!acc[order.table_number]) {
            acc[order.table_number] = [];
        }
        acc[order.table_number].push(order);
        return acc;
    }, {});

    const calculateTableTotal = (tableOrders) => {
        return tableOrders.reduce((sum, order) => sum + order.total, 0);
    };

    const getTableStatus = (tableOrders) => {
        const allCompleted = tableOrders.every(order => order.status === 'completed');
        const hasCancelled = tableOrders.some(order => order.status === 'cancelled');
        
        if (hasCancelled) return 'cancelled';
        if (allCompleted) return 'ready_to_pay';
        return 'in_progress';
    };

    const getStatusBadge = (status) => {
        const variants = {
            'in_progress': 'warning',
            'ready_to_pay': 'success',
            'cancelled': 'danger',
            'completed': 'primary',
            'preparing': 'info',
            'pending': 'secondary',
            'served': 'success',  // Add variant for served status
            'ready_to_serve': 'info'  // Add variant for ready_to_serve status
        };
        const labels = {
            'in_progress': 'In Progress',
            'ready_to_pay': 'Ready to Pay',
            'cancelled': 'Cancelled',
            'completed': 'Completed',
            'preparing': 'Preparing',
            'pending': 'Pending',
            'served': 'Served',  // Add label for served status
            'ready_to_serve': 'Ready to Serve'  // Add label for ready_to_serve status
        };
        return <Badge bg={variants[status]}>{labels[status]}</Badge>;
    };

    const handleViewDetails = (tableNumber) => {
        setSelectedTableOrders(groupedOrders[tableNumber]);
        setShowDetailsModal(true);
    };

    const handleCancelOrder = (orderId) => {
        onOrderUpdate(orderId, 'cancelled');
    };

    const handlePayment = (tableNumber) => {
        const tableOrders = groupedOrders[tableNumber];
        if (getTableStatus(tableOrders) === 'ready_to_pay') {
            onPayment(tableNumber, tableOrders);
        }
    };

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState({
        customerName: '',
        age: '',
        phoneNumber: '',  // Changed from birthDate
        membershipCard: 'no',
        membershipId: '',
        paymentMethod: 'cash',
        note: '',
        cashReceived: 0
    });
    const [errors, setErrors] = useState({});
    const [currentTableData, setCurrentTableData] = useState(null);
    const [showBillModal, setShowBillModal] = useState(false);
    const [billData, setBillData] = useState(null);

    const validateForm = () => {
        const newErrors = {};
        if (!paymentInfo.customerName.trim()) {
            newErrors.customerName = 'Vui lòng nhập tên khách hàng';
        }
        if (!paymentInfo.age || paymentInfo.age <= 0) {
            newErrors.age = 'Vui lòng nhập tuổi hợp lệ';
        }
        if (!paymentInfo.phoneNumber) {
            newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
        } else {
            const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
            if (!phoneRegex.test(paymentInfo.phoneNumber)) {
                newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
            }
        }
        if (paymentInfo.membershipCard === 'yes' && !paymentInfo.membershipId) {
            newErrors.membershipId = 'Vui lòng nhập mã thẻ thành viên';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePaymentSubmit = () => {
        if (validateForm()) {
            // Generate bill data
            const currentDate = new Date().toLocaleString('vi-VN');
            const billData = {
                tableNumber: currentTableData.tableNumber,
                waiterId: 'waiter1', // Replace with actual logged-in user ID
                date: currentDate,
                customerInfo: {
                    name: paymentInfo.customerName,
                    age: paymentInfo.age,
                    phoneNumber: paymentInfo.phoneNumber,
                    hasMembership: paymentInfo.membershipCard === 'yes',
                    membershipId: paymentInfo.membershipId
                },
                orders: currentTableData.orders.map(order => ({
                    id: order.id,
                    created_at: order.created_at,  // Pass the full created_at from order
                    items: order.items
                })),
                totalAmount: calculateTableTotal(currentTableData.orders),
                paymentMethod: paymentInfo.paymentMethod
            };

            // Save payment to database (you'll need to implement this API call)
            const paymentData = {
                order_ids: currentTableData.orders.map(order => order.id),
                amount: billData.totalAmount,
                payment_type: paymentInfo.paymentMethod,
                table_id: currentTableData.tableNumber,
                waiter_id: billData.waiterId,
                customer_name: paymentInfo.customerName,
                customer_age: paymentInfo.age,
                customer_number: paymentInfo.phoneNumber,
                has_membership: paymentInfo.membershipCard === 'yes' ? 1 : 0,
                membership_id: paymentInfo.membershipId || null
            };

            // Show bill
            setBillData(billData);
            setShowBillModal(true);
            setShowPaymentModal(false);
            
            // Reset payment info
            setPaymentInfo({
                customerName: '',
                age: '',
                phoneNumber: '',
                membershipCard: 'no',
                membershipId: '',
                paymentMethod: 'cash',
                note: '',
                cashReceived: 0
            });
        }
    };

    const handlePaymentClick = (tableNumber, tableOrders) => {
        setCurrentTableData({ tableNumber, orders: tableOrders });
        setShowPaymentModal(true);
    };




    // Modify the existing payment button to use the new handler
    return (
        <div className="active-orders">
            <h3>Active Orders</h3>
            <div className="row" style={{ 
                maxHeight: '70vh', 
                overflowY: 'auto',
                paddingRight: '5px'
            }}>
                {Object.entries(groupedOrders).map(([tableNumber, tableOrders]) => {
                    const tableStatus = getTableStatus(tableOrders);
                    const tableTotal = calculateTableTotal(tableOrders);

                    return (
                        <div key={tableNumber} className="col-12 mb-3">
                            <Card>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="mb-0">Table {tableNumber}</h5>
                                        {getStatusBadge(tableStatus)}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <strong>Total: {formatVND(tableTotal)}</strong>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant="primary"
                                                onClick={() => handleViewDetails(tableNumber)}
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                variant="success"
                                                disabled={tableStatus !== 'ready_to_pay'}
                                                onClick={() => handlePaymentClick(tableNumber, tableOrders)}
                                            >
                                                Payment
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    );
                })}
            </div>

            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        Order Details - Table {selectedTableOrders?.[0]?.table_number}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTableOrders?.map((order) => (
                        <Card key={order.id} className="mb-3">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                                <span>Order #{order.id}</span>
                                <div className="d-flex gap-2 align-items-center">
                                    {getStatusBadge(order.status)}
                                    {order.status !== 'cancelled' && (
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => handleCancelOrder(order.id)}
                                            disabled={order.status !== 'pending'}
                                        >
                                            Cancel Order
                                        </Button>
                                    )}
                                </div>
                            </Card.Header>
                            <ListGroup variant="flush">
                                {order.items?.map((item, index) => (
                                    <ListGroup.Item 
                                        key={index}
                                    >
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>{item.name} x {item.quantity}</span>
                                            <span>{formatVND(item.price * item.quantity)}</span>
                                        </div>
                                        {item.note && (
                                            <small className="text-muted">Note: {item.note}</small>
                                        )}
                                    </ListGroup.Item>
                                ))}
                                <ListGroup.Item className="d-flex justify-content-between">
                                    <strong>Order Total:</strong>
                                    <strong>{formatVND(order.total)}</strong>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card>
                    ))}
                </Modal.Body>
            </Modal>

            {/* Add Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Thông tin khách hàng - Bàn {currentTableData?.tableNumber}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên khách hàng *</Form.Label>
                            <Form.Control
                                type="text"
                                value={paymentInfo.customerName}
                                onChange={(e) => setPaymentInfo({...paymentInfo, customerName: e.target.value})}
                                isInvalid={!!errors.customerName}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.customerName}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Tuổi *</Form.Label>
                            <Form.Control
                                type="number"
                                value={paymentInfo.age}
                                onChange={(e) => setPaymentInfo({...paymentInfo, age: e.target.value})}
                                isInvalid={!!errors.age}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.age}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại *</Form.Label>
                            <Form.Control
                                type="text"
                                value={paymentInfo.phoneNumber}
                                onChange={(e) => setPaymentInfo({...paymentInfo, phoneNumber: e.target.value})}
                                isInvalid={!!errors.phoneNumber}
                                placeholder="Ví dụ: 0912345678"
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.phoneNumber}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Thẻ thành viên *</Form.Label>
                            <Form.Select
                                value={paymentInfo.membershipCard}
                                onChange={(e) => setPaymentInfo({...paymentInfo, membershipCard: e.target.value})}
                            >
                                <option value="no">Không</option>
                                <option value="yes">Có</option>
                            </Form.Select>
                        </Form.Group>

                        {paymentInfo.membershipCard === 'yes' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Mã thẻ thành viên *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={paymentInfo.membershipId}
                                    onChange={(e) => setPaymentInfo({...paymentInfo, membershipId: e.target.value})}
                                    isInvalid={!!errors.membershipId}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.membershipId}
                                </Form.Control.Feedback>
                            </Form.Group>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handlePaymentSubmit}>
                        Xác nhận
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* ... existing Details Modal ... */}
            
            <BillDisplay 
                show={showBillModal}
                onHide={() => setShowBillModal(false)}
                billData={billData}
            />
        </div>
    );
};

export default ActiveOrders;

//test