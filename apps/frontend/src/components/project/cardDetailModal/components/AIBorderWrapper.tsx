import React from 'react';
import { theme } from 'antd';

const AIBorderWrapper: React.FC<{ children: React.ReactNode; active?: boolean }> = ({
  children,
  active,
}) => {
  const { token } = theme.useToken();

  return (
    <>
      <div className={active ? 'active' : 'inactive'}>
        <div className="content">{children}</div>
      </div>
      <style jsx>{`
        div {
          position: relative;
          border-radius: 12px;
          padding: 2px;
          transition: all 0.3s ease;
        }
        .active {
          padding: 3px;
          background-image: linear-gradient(
            90deg,
            ${token.colorPrimary},
            ${token.colorSuccess},
            ${token.colorWarning},
            ${token.colorError},
            ${token.colorPrimary}
          );
          background-repeat: no-repeat;
          background-position: 0% 50%;
          background-size: 200% 200%;
          animation: gradient 2.5s ease infinite;
          box-shadow: 0 0 20px ${token.colorPrimary}66;
        }
        .inactive {
          background-image: linear-gradient(
            90deg,
            ${token.colorBorderSecondary},
            ${token.colorBorder},
            ${token.colorBorderSecondary}
          );
          background-repeat: no-repeat;
          background-position: 0% 50%;
          background-size: 200% 200%;
          animation: none;
          box-shadow: none;
        }
        .content {
          background: ${token.colorBgContainer};
          border-radius: 10px;
          padding: 16px;
          height: 100%;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
};

export default AIBorderWrapper;
