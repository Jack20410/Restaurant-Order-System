import React, { useState } from 'react';
import { Card, ListGroup, Badge, Button, Modal, Form, Row, Col } from 'react-bootstrap';

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
        birthDate: '',
        membershipCard: 'no',
        membershipId: '',
        paymentMethod: 'cash',
        note: '',
        cashReceived: 0
    });
    const [currentTableData, setCurrentTableData] = useState(null);

    const handlePaymentClick = (tableNumber, tableOrders) => {
        setCurrentTableData({ tableNumber, orders: tableOrders });
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async () => {
        if (!paymentInfo.customerName || !paymentInfo.age || !paymentInfo.birthDate) {
            alert('Vui lòng nhập đầy đủ thông tin khách hàng trước khi thanh toán.');
            return;
        }

        const paymentData = {
            tableNumber: currentTableData.tableNumber,
            orders: currentTableData.orders,
            customerInfo: paymentInfo,
            total: calculateTableTotal(currentTableData.orders),
            discount: paymentInfo.membershipCard === 'yes' ? 0.1 : 0,
            paymentMethod: paymentInfo.paymentMethod,
            note: paymentInfo.note,
            waiterId: 'waiter1', // Get from auth context in real app
            timestamp: new Date().toISOString()
        };

        try {
            await onPayment(paymentData);
            setShowPaymentModal(false);
            setPaymentInfo({
                customerName: '',
                age: '',
                birthDate: '',
                membershipCard: 'no',
                membershipId: '',
                paymentMethod: 'cash',
                note: '',
                cashReceived: 0
            });
        } catch (error) {
            alert('Thanh toán thất bại. Vui lòng thử lại.');
        }
    };

    const PaymentModal = () => (
        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Payment Information - Table {currentTableData?.tableNumber}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên khách hàng *</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={paymentInfo.customerName}
                                    onChange={(e) => setPaymentInfo({...paymentInfo, customerName: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Tuổi *</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={paymentInfo.age}
                                    onChange={(e) => setPaymentInfo({...paymentInfo, age: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3}>
                            <Form.Group className="mb-3">
                                <Form.Label>Ngày sinh *</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={paymentInfo.birthDate}
                                    onChange={(e) => setPaymentInfo({...paymentInfo, birthDate: e.target.value})}
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Thẻ thành viên</Form.Label>
                                <Form.Select
                                    value={paymentInfo.membershipCard}
                                    onChange={(e) => setPaymentInfo({...paymentInfo, membershipCard: e.target.value})}
                                >
                                    <option value="no">Không</option>
                                    <option value="yes">Có</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        {paymentInfo.membershipCard === 'yes' && (
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mã thẻ thành viên</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={paymentInfo.membershipId}
                                        onChange={(e) => setPaymentInfo({...paymentInfo, membershipId: e.target.value})}
                                    />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>

                    <Form.Group className="mb-3">
                        <Form.Label>Phương thức thanh toán</Form.Label>
                        <Form.Select
                            value={paymentInfo.paymentMethod}
                            onChange={(e) => setPaymentInfo({...paymentInfo, paymentMethod: e.target.value})}
                        >
                            <option value="cash">Tiền mặt</option>
                            <option value="card">Thẻ tín dụng</option>
                            <option value="transfer">Chuyển khoản</option>
                            <option value="ewallet">Ví điện tử</option>
                        </Form.Select>
                    </Form.Group>

                    {paymentInfo.paymentMethod === 'cash' && (
                        <Form.Group className="mb-3">
                            <Form.Label>Số tiền nhận</Form.Label>
                            <Form.Control
                                type="number"
                                value={paymentInfo.cashReceived}
                                onChange={(e) => setPaymentInfo({...paymentInfo, cashReceived: parseFloat(e.target.value)})}
                            />
                            {paymentInfo.cashReceived > 0 && (
                                <Form.Text>
                                    Tiền thối: {formatVND(paymentInfo.cashReceived - calculateTableTotal(currentTableData?.orders))}
                                </Form.Text>
                            )}
                        </Form.Group>
                    )}

                    <Form.Group className="mb-3">
                        <Form.Label>Ghi chú</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={paymentInfo.note}
                            onChange={(e) => setPaymentInfo({...paymentInfo, note: e.target.value})}
                        />
                    </Form.Group>

                    <div className="payment-summary">
                        <h5>Tổng quan thanh toán</h5>
                        <p>Tổng tiền: {formatVND(calculateTableTotal(currentTableData?.orders))}</p>
                        {paymentInfo.membershipCard === 'yes' && (
                            <>
                                <p>Giảm giá (10%): {formatVND(calculateTableTotal(currentTableData?.orders) * 0.1)}</p>
                                <p>Tổng thanh toán sau giảm giá: {formatVND(calculateTableTotal(currentTableData?.orders) * 0.9)}</p>
                            </>
                        )}
                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
                    Hủy
                </Button>
                <Button variant="primary" onClick={handlePaymentSubmit}>
                    Xác nhận thanh toán
                </Button>
            </Modal.Footer>
        </Modal>
    );

    // Modify the existing payment button to use the new handler
    return (
        <div className="active-orders">
            <h3>Active Orders</h3>
            <div className="row">
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
                                {getStatusBadge(order.status)}
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
        </div>
    );
};

export default ActiveOrders;