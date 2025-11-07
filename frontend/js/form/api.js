export async function loadUsers() {
  try {
    const [personalRes, resiRes] = await Promise.all([
      fetch("/users/personal"),
      fetch("/users/residentes"),
    ]);

    const allProfessionals = await personalRes.json();
    const allResidents = await resiRes.json();

    return { allProfessionals, allResidents };
  } catch (err) {
    console.error("❌ Error obteniendo personal/residentes:", err);
    return { allProfessionals: [], allResidents: [] };
  }
}
