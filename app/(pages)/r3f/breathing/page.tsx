import { Wrapper } from '~/app/(pages)/(components)/wrapper'

import { BreathingExperience } from './(components)/breathing-experience'

export default function BreathingPage() {
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
