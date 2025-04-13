import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const BillDisplay = ({ show, onHide, billData }) => {
    console.log('Bill Data:', billData); // Add this line to inspect the data
    console.log('Orders:', billData?.orders); // Add this to specifically check orders

    const handlePrint = () => {
        window.print();
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Phiếu tính tiền - Bàn {billData?.tableNumber}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="bill-content">
                    <div className="text-center mb-4">
                        <h2>PHIẾU TÍNH TIỀN</h2>
                        <h4>Bàn {billData?.tableNumber}</h4>
                    </div>
                    
                    <div className="mb-3">
                        <p><strong>Nhân viên phục vụ:</strong> {billData?.waiterId}</p>
                        <p><strong>Ngày:</strong> {billData?.date}</p>
                    </div>

                    <div className="mb-3">
                        <h5>Thông tin khách hàng:</h5>
                        <p>Tên: {billData?.customerInfo.name}</p>
                        <p>Tuổi: {billData?.customerInfo.age}</p>
                        <p>Số điện thoại: {billData?.customerInfo.phoneNumber}</p>
                        <p>Thẻ thành viên: {billData?.customerInfo.hasMembership ? 
                            `Có (Mã: ${billData.customerInfo.membershipId})` : 'Không'}</p>
                    </div>

                    <div className="mb-3">
                        <h5>Chi tiết đơn hàng:</h5>
                        {billData?.orders.map((order, index) => (
                            <div key={index} className="mb-2">
                                {/* <p><strong>{order.id}</strong> ({order.created_at})</p> */}
                                <ul>
                                    {order.items.map((item, idx) => (
                                        <li key={idx}>
                                            {item.name} x {item.quantity} ({new Intl.NumberFormat('vi-VN', {
                                                style: 'currency',
                                                currency: 'VND'
                                            }).format(item.price * item.quantity)})
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="mb-3">
                        <h5>Tổng tiền: {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND'
                        }).format(billData?.totalAmount)}</h5>
                        <p><strong>Phương thức thanh toán:</strong> {billData?.paymentMethod}</p>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Đóng
                </Button>
                <Button variant="primary" onClick={handlePrint}>
                    In phiếu
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default BillDisplay;