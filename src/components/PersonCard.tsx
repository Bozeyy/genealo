import React from 'react';

interface PersonProps {
  firstName: string;
  lastName?: string | null;
  birthDate?: Date | null;
  deathDate?: Date | null;
  photoUrl?: string | null;
}

export default function PersonCard({ person }: { person: PersonProps }) {
  const formatYear = (date?: Date | null) => {
    if (!date) return '';
    return new Date(date).getFullYear();
  };

  const hasDates = person.birthDate || person.deathDate;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '250px' }}>
      <div 
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden'
        }}
      >
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={`${person.firstName} ${person.lastName}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}>
            {person.firstName.charAt(0)}
            {person.lastName ? person.lastName.charAt(0) : ''}
          </span>
        )}
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
          {person.firstName} {person.lastName}
        </h4>
        {hasDates && (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {formatYear(person.birthDate)} - {formatYear(person.deathDate) || 'Présent'}
          </p>
        )}
      </div>
    </div>
  );
}
