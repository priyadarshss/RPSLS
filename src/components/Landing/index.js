import Image from 'next/image'
import Link from 'next/link'

function RPSGame() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-black text-white'>
      <div className='text-center flex flex-col items-center justify-cente w-full'>
        <h1 className='text-6xl font-normal mb-8 leading-normal'>
          Rock, Paper, Scissors, {<br />} Lizard & Spock
        </h1>
        <Image
          src='https://rpsls-game.vercel.app/assets/img/RPSLS.png'
          alt='Rock, Paper, Scissors, Lizard & Spock'
          width={300}
          height={100}
          priority
          className='hover:scale-110 transition duration-300 ease-in-out opacity-80 hover:opacity-100'
        />
        <div className='mt-20'>
          <Link href='/start'>
            <button className='bg-[#8575FF] text-white p-4 m-4 rounded-full hover:bg-[#6145ff] transition duration-300 ease-in-out'>
              Start New Game
            </button>
          </Link>
          <Link href='/join'>
            <button className='bg-[#8575FF] text-white p-4 m-4 rounded-full hover:bg-[#6145ff] transition duration-300 ease-in-out'>
              Join Existing Game
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RPSGame
