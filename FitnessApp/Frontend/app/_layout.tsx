import React from 'react';
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack
  screenOptions={{
    headerShown: false,
  }}>
    <Stack.Screen name="index" />
</Stack>;
}


// export default function TabsLayout() {
//   return (
//     <Tabs>
//       <Tabs.Screen name = "index" options = { {
//         headerTitle: "FWLR test",
//         headerLeft: () => <></>
//       } } />
//       <Tabs.Screen name = "about" options = { {
//         headerTitle: "DSLR test",
//         headerLeft: () => <></>
//       } } />

//     </Tabs>
//   );
// }