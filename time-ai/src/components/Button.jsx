function Button({ children, onClick, disabled, className = '' }) {
  return (
    <button 
      className={`btn-primary ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button