import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import {
  FONT_STYLESHEET,
  codeBox,
  container,
  content,
  footer,
  h1,
  header,
  headerText,
  main,
  text,
} from './brand'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <link rel="stylesheet" href={FONT_STYLESHEET} />
    </Head>
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>Guofsyrians</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm reauthentication</Heading>
          <Text style={text}>Use the code below to confirm your identity:</Text>
          <Text style={codeBox}>{token}</Text>
          <Text style={footer}>
            This code will expire shortly. If you didn't request this, you can
            safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
