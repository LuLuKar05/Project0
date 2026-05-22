import React from 'react'
import Image from 'next/image'
export default function Button({icon}:{ icon: string | StaticImageData }) {
  return (
    <>
    <button>
        <Image src={icon} alt="Logo" width={100} height={100} />

    </button>
    </>
  )
}
