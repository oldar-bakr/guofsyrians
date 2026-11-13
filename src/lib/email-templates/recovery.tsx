import * as React from 'react'

import {
  Body,
  Button,
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
  button,
  container,
  content,
  footer,
  h1,
  header,
  headerText,
  main,
  text,
} from './brand'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <link rel="stylesheet" href={FONT_STYLESHEET} />
    </Head>
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>{siteName}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password for {siteName}. Click
            the button below to choose a new password.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Reset Password
          </Button>
          <Text style={footer}>
            If you didn't request a password reset, you can safely ignore this
            email. Your password will not be changed.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
