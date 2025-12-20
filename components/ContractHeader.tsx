/**
 * Contract Header Component
 * 
 * Branded header for all VelocityMaid Jamaica contracts
 */

export default function ContractHeader({ title }: { title: string }) {
  return (
    <div style={{
      borderBottom: '3px solid #F8C548',
      paddingBottom: '20px',
      marginBottom: '30px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '15px',
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#0A3D2F',
            margin: 0,
            fontFamily: 'Montserrat, Arial, sans-serif',
          }}>
            VelocityMaid
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#2B70C9',
            margin: '5px 0 0 0',
            fontWeight: 600,
          }}>
            Jamaica Branch
          </p>
        </div>
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#F8C548',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0A3D2F',
          fontSize: '24px',
          fontWeight: 'bold',
        }}>
          VM
        </div>
      </div>
      <div style={{
        borderTop: '2px solid #F3F1EB',
        paddingTop: '15px',
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#0A3D2F',
          margin: 0,
          fontFamily: 'Montserrat, Arial, sans-serif',
        }}>
          {title}
        </h2>
      </div>
    </div>
  );
}


