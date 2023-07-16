import { useSprings, animated } from '@react-spring/web'


const items = Array.from({length: 5}, (_, i) => i); // Creates an array [0, 1, 2, 3, 4]

const Component: React.FC = () => {
    const springs = useSprings(
      items.length,
      items.map((item, i) => ({
        from: { transform: 'translate3d(0, -50px, 0)', opacity: 0 },
        to: { transform: 'translate3d(0, 0px, 0)', opacity: 1 },
        config: { tension: 20, friction: 20 },
        delay: i * 200,
      }))
    )
    return (
      <div style={{position: 'relative', height: '200px', width: '200px', border: '1px solid black'}}>
        {springs.map((props, i) => (
          <animated.div
            key={i}
            style={{
              ...props,
              position: 'absolute',
              height: '20px',
              width: '20px',
              borderRadius: '50%',
              backgroundColor: 'blue',
            }}
          />
        ))}
      </div>
    )
  }
  
  export default Component