// PaymentCallback.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { FaRegCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { format } from 'date-fns';
import Header from '../components/common/Header';
import { useBooking } from '../context/BookingContext';

const PageContainer = styled.div`
  background-color: #0f0f1e;
  color: #fff;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const MessageContainer = styled.div`
  background: #16213e;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  max-width: 500px;
`;

const Icon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: ${props => (props.success ? '#4caf50' : '#e94560')};
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #a0a0a0;
  margin-bottom: 2rem;
`;

const TicketDetails = styled.div`
  background: #1a1a2e;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: left;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  &:hover {
    background: #ff6b81;
  }
`;

const PaymentCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSelectedSeats, resetBooking, setRecentTickets } = useBooking();
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [ticketDetails, setTicketDetails] = useState(null);
  const backendUrl = process.env.REACT_APP_API_URL || 'https://galaxycinema-a6eeaze9afbagaft.southeastasia-01.azurewebsites.net';

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const apptransid = query.get('apptransid');
    const statusCode = query.get('status');

    if (!apptransid || !statusCode) {
      setStatus('error');
      setMessage('Thông tin thanh toán không hợp lệ. Vui lòng thử lại.');
      return;
    }

    const verifyPayment = async () => {
      try {
        // Bước 1: Kiểm tra trạng thái giao dịch ZaloPay
        const paymentResponse = await axios.get(`${backendUrl}/ZaloPay/CheckOrderStatus`, {
          params: { apptransid },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (paymentResponse.data.success) {
          setStatus('success');
          setMessage(`Thanh toán thành công! Mã giao dịch: ${apptransid}`);

          // Bước 2: Lấy chi tiết vé bằng API /Ticket/GetTicketBYId
          const ticketId = paymentResponse.data.ticketId; // Giả sử API trả về ticketId
          if (ticketId) {
            const ticketResponse = await axios.get(`${backendUrl}/Ticket/GetTicketBYId/${ticketId}`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });

            const ticketData = ticketResponse.data;
            const formattedTicket = {
              appTransId: apptransid,
              title: ticketData.title || 'Unknown',
              startTime: ticketData.startTime || new Date(),
              roomNumber: ticketData.roomNumber || 'N/A',
              seats: ticketData.seatNumber ? [ticketData.seatNumber] : [],
              totalPrice: ticketData.price || 0,
            };
            setTicketDetails(formattedTicket);
            setRecentTickets(formattedTicket); // Lưu vào BookingContext
          }

          setSelectedSeats([]);
          resetBooking();
        } else {
          setStatus('error');
          setMessage('Thanh toán thất bại. Vui lòng thử lại.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng liên hệ hỗ trợ.');
      }
    };

    verifyPayment();
  }, [location, backendUrl, setSelectedSeats, resetBooking, setRecentTickets]);

  const handleBack = () => {
    navigate('/booking/history');
  };

  return (
    <PageContainer>
      <Header />
      <MessageContainer>
        <Icon success={status === 'success'}>
          {status === 'success' ? <FaRegCheckCircle /> : <FaTimesCircle />}
        </Icon>
        <Title>{status === 'success' ? 'Thanh Toán Thành Công' : 'Thanh Toán Thất Bại'}</Title>
        <Message>{message}</Message>
        {ticketDetails && status === 'success' && (
          <TicketDetails>
            <DetailRow>
              <span>Phim:</span>
              <span>{ticketDetails.title}</span>
            </DetailRow>
            <DetailRow>
              <span>Suất chiếu:</span>
              <span>{format(new Date(ticketDetails.startTime), 'dd/MM/yyyy HH:mm')}</span>
            </DetailRow>
            <DetailRow>
              <span>Phòng:</span>
              <span>{ticketDetails.roomNumber}</span>
            </DetailRow>
            <DetailRow>
              <span>Ghế:</span>
              <span>{ticketDetails.seats.join(', ') || 'N/A'}</span>
            </DetailRow>
            <DetailRow>
              <span>Tổng tiền:</span>
              <span>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ticketDetails.totalPrice)}
              </span>
            </DetailRow>
          </TicketDetails>
        )}
        <Button onClick={handleBack}>Xem Lịch Sử Đặt Vé</Button>
      </MessageContainer>
    </PageContainer>
  );
};

export default PaymentCallback;