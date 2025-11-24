import { Wrapper } from '~/app/(pages)/(components)/wrapper'

import { BreathingExperience } from './(pages)/r3f/breathing/(components)/breathing-experience'

export default function RootPage() {
  return (
    <Wrapper
      theme="dark"
      className="gap-10"
      webgl={{ force: true }}
      navigation={false}
    >
      <BreathingExperience />
    </Wrapper>
  )
}
