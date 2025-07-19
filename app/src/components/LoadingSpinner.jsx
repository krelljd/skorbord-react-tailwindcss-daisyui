const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-100">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="mt-4 text-base-content/70 text-4vw">Loading...</p>
      </div>
    </div>
  )
}

export default LoadingSpinner
