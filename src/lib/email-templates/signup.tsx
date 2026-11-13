import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
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
  link,
  main,
  text,
} from './brand'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <link rel="stylesheet" href={FONT_STYLESHEET} />
    </Head>
    <Preview>Confirm your email for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>{siteName}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Confirm your email</Heading>
          <Text style={text}>
            Thanks for signing up for{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            !
          </Text>
          <Text style={text}>
            Please confirm your email address (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) by clicking the button below:
          </Text>
          <Button style={button} href={confirmationUrl}>
            Verify Email
          </Button>
          <Text style={footer}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
