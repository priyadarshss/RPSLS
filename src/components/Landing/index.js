import Link from 'next/link'

function RPSGame() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-black text-white'>
      <div className='text-center flex flex-col items-center justify-cente w-full'>
        <h1 className='text-6xl font-normal mb-8 leading-normal'>
          Rock, Paper, Scissors, {<br />} Lizard & Spock
        </h1>
        <div className='mt-40'>
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
          <Link href='/continue'>
            <button className='bg-[#8575FF] text-white p-4 m-4 rounded-full hover:bg-[#6145ff] transition duration-300 ease-in-out'>
              Continue Game
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RPSGame
