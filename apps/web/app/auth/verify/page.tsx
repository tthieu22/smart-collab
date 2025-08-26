'use client';
import { useRef, useState, Suspense } from 'react';
import { Button, Card, Alert } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/app/lib/auth';
import { ERROR_MESSAGES, ROUTES } from '@/app/lib/constants';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Xử lý nhập từng ô
  const handleChange = (value: string, idx: number) => {
    if (!/^\d*$/.test(value)) return; // chỉ cho nhập số
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1); // chỉ lấy 1 số cuối
    setOtp(newOtp);

    // Tự động chuyển sang ô tiếp theo nếu có số
    if (value && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  // Xử lý dán mã
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputsRef.current[5]?.focus();
    }
  };

  // Gửi mã xác thực
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const code = otp.join('');
      if (code.length !== 6) {
        setError('Vui lòng nhập đủ 6 số!');
        setLoading(false);
        return;
      }
      const result = await authService.verifyEmail(email, code);
      if (result.success === true) {
        setSuccess('Xác thực thành công! Bạn có thể đăng nhập.');
        setTimeout(() => router.push(ROUTES.LOGIN), 1500);
      } else {
        setError(result.message || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã
  const handleResend = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await authService.resendVerificationCode(email);
      if (result.success === true) {
        setSuccess('Đã gửi lại mã xác thực về email!');
      } else {
        setError(result.message || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } catch {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#f5f6fa',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 8,
              color: '#262626',
            }}
          >
            Xác thực email
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: 14 }}>
            Nhập mã xác thực đã gửi về email <b>{email}</b>
          </p>
        </div>
        {error && (
          <Alert
            message={error}
            type='error'
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        {success && (
          <Alert
            message={success}
            type='success'
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el: HTMLInputElement | null) => {
                  inputsRef.current[idx] = el;
                }}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, idx)}
                onPaste={handlePaste}
                style={{
                  width: 40,
                  height: 48,
                  fontSize: 24,
                  textAlign: 'center',
                  border: '1px solid #d9d9d9',
                  borderRadius: 6,
                  outline: 'none',
                }}
                autoFocus={idx === 0}
              />
            ))}
          </div>
          <Button
            type='primary'
            htmlType='submit'
            size='large'
            loading={loading}
            style={{ width: '100%' }}
          >
            Xác thực
          </Button>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button type='link' onClick={handleResend} disabled={loading}>
            Gửi lại mã xác thực
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#f5f6fa',
          }}
        >
          <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  marginBottom: 8,
                  color: '#262626',
                }}
              >
                Đang tải...
              </h2>
            </div>
          </Card>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
