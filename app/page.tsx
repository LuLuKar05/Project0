import logo from '../public/next.svg'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
export default function page() {
  return (
      <nav className= "flex justify-between px-6.25 py-4">

        <div>
          <h1 className="text-2xl font-bold">
            MMT
            <span className="text-primary-header">.</span>
          </h1>
        </div>
        <div>
          <Input placeholder="Search..." />
          <Button icon={logo} />
        </div>
      </nav>
  )
}
