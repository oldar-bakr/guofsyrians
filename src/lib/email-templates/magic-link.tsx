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

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <link rel="stylesheet" href={FONT_STYLESHEET} />
    </Head>
    <Preview>Your login link for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={headerText}>{siteName}</Text>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Your login link</Heading>
          <Text style={text}>
            Click the button below to log in to {siteName}. This link will
            expire shortly.
          </Text>
          <Button style={button} href={confirmationUrl}>
            Log In
          </Button>
          <Text style={footer}>
            If you didn't request this link, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
