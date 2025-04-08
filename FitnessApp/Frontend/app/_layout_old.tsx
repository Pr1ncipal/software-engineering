import { Tabs, Stack } from "expo-router";

export default function RootLayout() {
  return <Stack>
  <Stack.Screen name="index" options={{ headerShown: false }} />
  <Stack.Screen name="+not-found" options={{ headerShown: false }} />
  <Stack.Screen name="profile_page" options={{ headerShown: false }} />
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