<script setup lang="ts">
import { HOVER_CLASS } from '~/composables/usePreviewForcedStyles'

// Content stage: the containers that use the content colors and radius.
const emit = defineEmits<{ pick: [target: string] }>()
</script>

<template>
  <PreviewStageSchemes intro="Containers that use the content colors. The accordion's second header is hovered. Click any part to edit it.">
    <template #default>
      <div class="grid gap-4 sm:grid-cols-2">
        <Card
          class="cursor-pointer"
          @click="emit('pick', 'cell:background:default')"
        >
          <template #title>
            Card
          </template>
          <template #content>
            <p class="m-0">
              Background, border and text come from content.
            </p>
          </template>
        </Card>
        <Panel
          header="Panel"
          class="cursor-pointer"
          @click="emit('pick', 'cell:border:default')"
        >
          <p class="m-0">
            The border uses the content border color.
          </p>
        </Panel>
      </div>
      <div
        class="cursor-pointer"
        @click="emit('pick', 'cell:background:hover')"
      >
        <Accordion value="0">
          <AccordionPanel value="0">
            <AccordionHeader>Open section</AccordionHeader>
            <AccordionContent>
              <p class="m-0">
                Accordion content on the content background.
              </p>
            </AccordionContent>
          </AccordionPanel>
          <AccordionPanel
            value="1"
            :class="HOVER_CLASS"
          >
            <AccordionHeader>Hovered section</AccordionHeader>
            <AccordionContent>
              <p class="m-0">
                More content.
              </p>
            </AccordionContent>
          </AccordionPanel>
        </Accordion>
      </div>
      <div
        class="cursor-pointer"
        @click="emit('pick', 'cell:text:default')"
      >
        <Tabs value="0">
          <TabList>
            <Tab value="0">
              Overview
            </Tab>
            <Tab value="1">
              Activity
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="0">
              <p class="m-0">
                Tab panels sit on the content background.
              </p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </template>
  </PreviewStageSchemes>
</template>
