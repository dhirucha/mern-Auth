import React from 'react'

const EmailVerify = () => {
  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400 '>

      <img onClick={()=> navigate('/')} src={assets.logo} alt="" className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'/>

      <form className='bg-slate-900 p-8 rounded-lg shadow-lg w-96 text-sm'></form>

    </div>
  )
}

export default EmailVerify